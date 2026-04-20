import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.motivation import get_motivation

router = APIRouter(prefix="/profile", tags=["Profile"])

# Folder to store uploaded profile pictures
UPLOAD_DIR = "uploads/profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_SIZE_MB = 2


@router.get("", response_model=schemas.UserResponse, summary="Get current user profile")
def get_profile(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.put("", response_model=schemas.UserResponse, summary="Update profile name")
def update_profile(
    data: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/picture", response_model=schemas.UserResponse, summary="Upload profile picture")
async def upload_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, GIF, WEBP images are allowed",
        )

    # Validate file size
    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size is {MAX_SIZE_MB}MB",
        )

    # Delete old picture if exists
    if current_user.profile_picture:
        old_path = os.path.join(UPLOAD_DIR, current_user.profile_picture)
        if os.path.exists(old_path):
            os.remove(old_path)

    # Save new picture with unique name
    ext = file.filename.split(".")[-1]
    filename = f"user_{current_user.id}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    current_user.profile_picture = filename
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/picture", response_model=schemas.UserResponse, summary="Remove profile picture")
def delete_picture(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.profile_picture:
        path = os.path.join(UPLOAD_DIR, current_user.profile_picture)
        if os.path.exists(path):
            os.remove(path)
        current_user.profile_picture = None
        db.commit()
        db.refresh(current_user)
    return current_user


@router.get("/motivation", response_model=schemas.MotivationResponse, summary="Get personalized motivation")
def get_user_motivation(current_user: models.User = Depends(get_current_user)):
    name = current_user.full_name or current_user.username
    return get_motivation(name)