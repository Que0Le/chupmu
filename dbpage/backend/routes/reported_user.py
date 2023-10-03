from fastapi import APIRouter, Body, HTTPException, exceptions
import pymongo.errors as pmerrors

from database.database import *
from models.reported_user import *

router = APIRouter()


@router.post(
    "/",
    response_description="Reported User added into the database",
    response_model=Response,
)
async def add_reported_user_to_db(new_reported_user: ReportedUser = Body(...)):
    try:
        reported_user = await add_reported_user(new_reported_user)
        return {
            "status_code": 200,
            "response_type": "success",
            "description": "Reported User created successfully",
            "data": reported_user,
        }
    except pmerrors.DuplicateKeyError:
        raise HTTPException(
            status_code=409, detail=f"User with id '{new_reported_user.userid}' exists"
        )
    except:
        raise HTTPException(status_code=500, detail="")

@router.get(
    "/", response_description="Reported User retrieved by uid", 
    response_model=Response
)
async def get_reported_user_by_uid(uid: str):
    reported_user = await retrieve_reported_user_by_uid(uid)
    if reported_user:
        return {
            "status_code": 200,
            "response_type": "success",
            "description": "Reported User retrieved successfully",
            "data": reported_user,
        }
    raise HTTPException(
        status_code=404, detail=f"User with uid '{uid}' not found"
    )

@router.get(
    "/{id}", response_description="Reported User retrieved by id", 
    response_model=Response
)
async def get_reported_user_by_id(id: PydanticObjectId):
    reported_user = await retrieve_reported_user_by_id(id)
    if reported_user:
        return {
            "status_code": 200,
            "response_type": "success",
            "description": "Reported User retrieved successfully",
            "data": reported_user,
        }
    raise HTTPException(
        status_code=404, detail=f"User with id '{id}' not found"
    )

