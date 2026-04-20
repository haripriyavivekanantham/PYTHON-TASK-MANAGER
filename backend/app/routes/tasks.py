from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.motivation import get_reward, get_random_quote

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post(
    "",
    response_model=schemas.TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
)
def create_task(
    task_data: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Validate time range
    if task_data.start_time and task_data.end_time:
        if task_data.end_time <= task_data.start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="end_time must be after start_time",
            )

    task = models.Task(
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority or "medium",
        start_time=task_data.start_time,
        end_time=task_data.end_time,
        owner_id=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get(
    "",
    response_model=schemas.PaginatedTasks,
    summary="Get all tasks (with filtering & pagination)",
)
def get_tasks(
    completed: Optional[bool] = Query(None),
    priority:  Optional[str]  = Query(None),
    page:      int = Query(1, ge=1),
    per_page:  int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Task).filter(models.Task.owner_id == current_user.id)

    if completed is not None:
        query = query.filter(models.Task.completed == completed)

    if priority is not None:
        if priority not in ("low", "medium", "high"):
            raise HTTPException(status_code=400, detail="Priority must be low, medium, or high")
        query = query.filter(models.Task.priority == priority)

    total = query.count()
    tasks = (
        query.order_by(models.Task.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return schemas.PaginatedTasks(total=total, page=page, per_page=per_page, tasks=tasks)


@router.get("/{task_id}", response_model=schemas.TaskResponse, summary="Get a specific task")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == current_user.id,
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task


@router.put("/{task_id}", response_model=dict, summary="Update a task")
def update_task(
    task_id: int,
    task_data: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == current_user.id,
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    # Validate time range if both provided
    new_start = task_data.start_time or task.start_time
    new_end   = task_data.end_time   or task.end_time
    if new_start and new_end and new_end <= new_start:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    was_completed = task.completed
    update_fields = task_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    # Build response — add reward if just completed
    response = schemas.TaskResponse.model_validate(task).model_dump()
    response["reward"] = None
    response["quote"]  = None

    if not was_completed and task.completed:
        name = current_user.full_name or current_user.username
        response["reward"] = get_reward(name)
        response["quote"]  = get_random_quote()

    return response


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a task")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == current_user.id,
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    db.delete(task)
    db.commit()