from fastapi import APIRouter, Body, HTTPException

from database.database import *
from models.report_data import *

router = APIRouter()


# @router.get("/", response_description="Report Meta retrieved", response_model=Response)
# async def get_report_meta_list():
#     report_meta_list = await retrieve_report_meta()
#     return {
#         "status_code": 200,
#         "response_type": "success",
#         "description": "Report Data retrieved successfully",
#         "data": report_meta_list,
#     }


@router.get("/", response_description="Report Data retrieved", response_model=Response)
async def get_report_data_list():
    report_data_list = await retrieve_report_data()
    return {
        "status_code": 200,
        "response_type": "success",
        "description": "Report Data retrieved successfully",
        "data": report_data_list,
    }


@router.get(
    "/{id}", response_description="Report Data retrieved by id", response_model=Response
)
async def get_report_data_by_id(id: PydanticObjectId):
    report_data = await retrieve_report_data_by_id(id)
    if report_data:
        return {
            "status_code": 200,
            "response_type": "success",
            "description": "Report Data retrieved successfully",
            "data": report_data,
        }
    raise HTTPException(
        status_code=404, detail=f"Report Data with ID not found: {id} ")


@router.post(
    "/",
    response_description="Report Data added into the database",
    response_model=Response,
)
async def add_report_data_to_db(new_report_data: ReportData = Body(...)):
    report_data = await add_report_data(new_report_data)
    return {
        "status_code": 200,
        "response_type": "success",
        "description": "Report Data created successfully",
        "data": report_data,
    }


@router.delete("/{id}", response_description="Report Data deleted from the database")
async def delete_report_data_from_db(id: PydanticObjectId):
    is_deleted = await delete_report_data(id)
    print(is_deleted)
    if is_deleted:
        return {
            "status_code": 200,
            "response_type": "success",
            "description": "Report Data with ID: {} removed".format(id),
            "data": True,
        }
    raise HTTPException(
        status_code=404, detail=f"Report Data with ID not found: {id} ")


# @router.put("/{id}", response_model=Response)
# async def update_student(id: PydanticObjectId, req: UpdateStudentModel = Body(...)):
#     updated_student = await update_student_data(id, req.dict())
#     if updated_student:
#         return {
#             "status_code": 200,
#             "response_type": "success",
#             "description": "Student with ID: {} updated".format(id),
#             "data": updated_student,
#         }
#     return {
#         "status_code": 404,
#         "response_type": "error",
#         "description": "An error occurred. Student with ID: {} not found".format(id),
#         "data": False,
#     }
