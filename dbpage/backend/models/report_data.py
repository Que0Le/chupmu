from typing import Optional, Any

from beanie import Document
from pydantic import BaseModel

class DataUrlPayload(BaseModel):
    dataUrl: str
    description: str

class ReportData(Document):
    reporter: str
    reported_user: str
    url: str
    unixTime: int
    data_url_array: list[DataUrlPayload]

    class Config:
        schema_extra = {
            "example": {
                "reporter": "r1",
                "reported_user": "u1",
                "url": "url1",
                "unixTime": 12345643232,
                "data_url_array": ["data_url_1", "data_url_2"],
            }
        }

    class Settings:
        name = "report_data"


class UpdateReportDataModel(BaseModel):
    reporter: Optional[str]
    reported_user: Optional[str]
    url: Optional[str]
    data_url_array: Optional[list[DataUrlPayload]]

    class Collection:
        name = "report_data"

    class Config:
        schema_extra = {
            "example": {
                "reporter": "r1",
                "reported_user": "u1",
                "url": "url1",
                "data_url_array": ["data_url_1", "data_url_2"],
            }
        }


class Response(BaseModel):
    status_code: int
    response_type: str
    description: str
    data: Optional[Any]

    class Config:
        schema_extra = {
            "example": {
                "status_code": 200,
                "response_type": "success",
                "description": "Operation successful",
                "data": "Sample data",
            }
        }
