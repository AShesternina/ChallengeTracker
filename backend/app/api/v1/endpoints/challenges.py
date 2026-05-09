from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.challenge import (
    ChallengeCreate,
    ChallengeInstanceOut,
    ChallengeInstanceUpdate,
    ChallengeOut,
    ChallengeTemplateOut,
    PublicTemplateOut,
    StartChallengeRequest,
)
from app.services.challenge_service import (
    complete_expired_challenges,
    create_challenge,
    delete_instance,
    get_instance,
    get_template_by_slug,
    get_user_challenges,
    list_templates,
    pause_instance,
    resume_instance,
    start_challenge,
    update_instance,
)

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("/templates", response_model=list[ChallengeTemplateOut])
async def get_templates(db: AsyncSession = Depends(get_db)):
    return await list_templates(db)


@router.get("/templates/{slug}", response_model=PublicTemplateOut)
async def get_public_template(slug: str, db: AsyncSession = Depends(get_db)):
    template = await get_template_by_slug(db, slug)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("", response_model=ChallengeOut, status_code=status.HTTP_201_CREATED)
async def create(
    data: ChallengeCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await create_challenge(db, user.id, data)


@router.post("/start", response_model=ChallengeInstanceOut, status_code=status.HTTP_201_CREATED)
async def start(
    data: StartChallengeRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return await start_challenge(db, user.id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/my", response_model=list[ChallengeInstanceOut])
async def my_challenges(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_user_challenges(db, user.id)


@router.get("/instances/{instance_id}", response_model=ChallengeInstanceOut)
async def get_instance_detail(
    instance_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    instance = await get_instance(db, instance_id, user.id)
    if not instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instance not found")
    return instance


@router.patch("/instances/{instance_id}", response_model=ChallengeInstanceOut)
async def update(
    instance_id: int,
    data: ChallengeInstanceUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return await update_instance(db, instance_id, user.id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/instances/{instance_id}/pause", response_model=ChallengeInstanceOut)
async def pause(
    instance_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return await pause_instance(db, instance_id, user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/instances/{instance_id}/resume", response_model=ChallengeInstanceOut)
async def resume(
    instance_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return await resume_instance(db, instance_id, user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/instances/{instance_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def delete_permanently(
    instance_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        await delete_instance(db, instance_id, user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
