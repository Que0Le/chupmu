from fastapi import APIRouter, Body

from database.database import *
from models.report_data import *

router = APIRouter()


@router.get("/", response_description="Report Meta retrieved", response_model=Response)
async def get_report_meta_list():
    report_meta_list = await retrieve_report_meta()
    return {
        "status_code": 200,
        "response_type": "success",
        "description": "Report Data retrieved successfully",
        "data": report_meta_list,
    }
