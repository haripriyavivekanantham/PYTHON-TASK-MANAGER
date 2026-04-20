from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ─── User Schemas ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)


# ─── Token Schemas ────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    username: Optional[str] = None


# ─── Task Schemas ─────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title:       str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority:    Optional[str] = Field("medium", pattern="^(low|medium|high)$")
    start_time:  Optional[datetime] = None
    end_time:    Optional[datetime] = None


class TaskUpdate(BaseModel):
    title:       Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    completed:   Optional[bool] = None
    priority:    Optional[str] = Field(None, pattern="^(low|medium|high)$")
    start_time:  Optional[datetime] = None
    end_time:    Optional[datetime] = None


class TaskResponse(BaseModel):
    id:          int
    title:       str
    description: Optional[str]
    completed:   bool
    priority:    str
    start_time:  Optional[datetime]
    end_time:    Optional[datetime]
    created_at:  datetime
    updated_at:  Optional[datetime]
    owner_id:    int

    class Config:
        from_attributes = True


class PaginatedTasks(BaseModel):
    total:    int
    page:     int
    per_page: int
    tasks:    list[TaskResponse]


# ─── Motivation Schemas ───────────────────────────────────────────────────────

class MotivationResponse(BaseModel):
    message: str
    quote:   str