from fastapi import APIRouter, Body, HTTPException, exceptions
import pymongo.errors as pmerrors

from database.database import *
from models.reported_user import *

router = APIRouter()


# @router.post(
#     "/",
#     response_description="Reported User added into the database",
#     response_model=Response,
# )
# async def add_reported_user_to_db(new_reported_user: ReportedUser = Body(...)):
#     try:
#         reported_user = await add_reported_user(new_reported_user)
#         return {
#             "status_code": 200,
#             "response_type": "success",
#             "description": "Reported User created successfully",
#             "data": reported_user,
#         }
#     except pmerrors.DuplicateKeyError:
#         raise HTTPException(
#             status_code=409, detail=f"User with id '{new_reported_user.userid}' exists"
#         )
#     except:
#         raise HTTPException(status_code=500, detail="")

@router.post(
    "/",
    response_description="Many Reported User added into the database",
    response_model=Response,
)
async def add_many_reported_users_to_db(new_reported_users: List[ReportedUser]):
    added_reported_users = []
    dupl_reported_users = []
    for new_reported_user in new_reported_users:
        try:
            reported_user = await add_reported_user(new_reported_user)
            added_reported_users.append(reported_user)
        except pmerrors.DuplicateKeyError:
            dupl_reported_users.append(new_reported_user)
        except Exception as e:
            print(e)
    if len(dupl_reported_users) == 0:
        return {
            "status_code": 201,
            "response_type": "success",
            "description": "Reported User(s) created successfully",
            "data": {"added_reported_users": added_reported_users},
        }
    else:
        dupl_str = ",".join([dru.userid for dru in dupl_reported_users])
        add_str = ",".join([aru.userid for aru in added_reported_users])
        return {
            "status_code": 201,
            "response_type": "success",
            "description": f"Reported User(s) created partially successfully. Duplicated: {dupl_str}",
            "data": {
                "added_reported_users": added_reported_users,
                "dupl_reported_users": dupl_reported_users
            },
        }


# @router.get(
#     "/", response_description="Reported User retrieved by uid and platform url",
#     response_model=Response
# )
# async def get_reported_user_by_uid_and_platformurl(uid: str, platform_url: str):
#     reported_user = await retrieve_reported_user_by_uid_and_platformurl(uid, platform_url)
#     if reported_user:
#         return {
#             "status_code": 200,
#             "response_type": "success",
#             "description": "Reported User retrieved successfully",
#             "data": reported_user,
#         }
#     raise HTTPException(
#         status_code=404,
#         detail=f"User with uid '{uid}' and platform_url '{platform_url}' not found"
#     )

# @router.get(
#     "/", response_description="Reported User retrieved by uid",
#     response_model=Response
# )
# async def get_reported_user_by_uid(uid: str):
#     reported_user = await retrieve_reported_user_by_uid(uid)
#     if reported_user:
#         return {
#             "status_code": 200,
#             "response_type": "success",
#             "description": "Reported User retrieved successfully",
#             "data": reported_user,
#         }
#     raise HTTPException(
#         status_code=404, detail=f"User with uid '{uid}' not found"
#     )

@router.post(
    "/get-many", response_description="Reported User retrieved by uid and platform url",
    response_model=Response
)
async def get_many_reported_users_by_uid_and_platformurl(ruqs: List[ReportedUserQuery]):
    reported_users = await retrieve_many_reported_users_by_uid_and_platformurl(ruqs)
    # if reported_users:
    return {
        "status_code": 200,
        "response_type": "success",
        "description": "Many Reported User retrieved successfully",
        "data": reported_users,
    } 


@router.get(
    "/id/{id}", response_description="Reported User retrieved by id",
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
