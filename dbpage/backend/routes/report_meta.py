from fastapi import APIRouter, Body

from database.database import *
from models.report_data import *

router = APIRouter()


@router.get("/many", response_description="Report Meta retrieved", response_model=Response)
async def get_report_meta_list(uid: str, platform_url: str):
    report_meta_list = await retrieve_report_meta_by_uid_and_platform(uid, platform_url)
    return {
        "status_code": 200,
        "response_type": "success",
        "description": "Report Data Meta retrieved successfully",
        "data": report_meta_list,
    }


@router.get("/all", response_description="Report Meta retrieved", response_model=Response)
async def get_report_meta_list():
    report_meta_list = await retrieve_report_meta()
    return {
        "status_code": 200,
        "response_type": "success",
        "description": "Report Data Meta retrieved successfully",
        "data": report_meta_list,
    }
