from typing import Optional, Any

from beanie import Document
from pydantic import BaseModel


# class FDbMetaData(BaseModel):
#     dbName: str
#     description: str
#     dbSource: str
#     onlineRecordUrlPrefix: str

# TODO: update schema_extra for each class after update

class DataUrlPayload(BaseModel):
    dataUrl: str
    description: str

class DbAndTheirTagNames(BaseModel):
    dbName: str
    tagNames: list[str]

class ReportDataMeta(Document):
    reporter: str
    reported_user: str
    filter_dbs: list[DbAndTheirTagNames]
    url: list[str]
    unixTime: int

    class Config:
        schema_extra = {
            "example": {
                "reporter": "r1",
                "reported_user": "u1",
                "filter_dbs": ["default_fdb1", "default_fdb2"],
                "url": "url1",
                "unixTime": 12345643232,
            }
        }

    class Settings:
        name = "report_data"

class ReportData(Document):
    reporter: str
    reported_user: str
    filter_dbs: list[DbAndTheirTagNames]
    url: list[str]
    unixTime: int
    data_url_array: list[DataUrlPayload]

    class Config:
        schema_extra = {
            "example": {
                "reporter": "r1",
                "reported_user": "u1",
                "filter_dbs": ["default_fdb1", "default_fdb2"],
                "url": "url1",
                "unixTime": 12345643232,
                "data_url_array": [
                    {"description": "desc1", "dataUrl": "data_url_1"}, 
                    {"description": "desc2", "dataUrl": "data_url_2"}
                ],
            }
        }

    class Settings:
        name = "report_data"


class UpdateReportDataModel(BaseModel):
    reporter: Optional[str]
    reported_user: Optional[str]
    filter_dbs: Optional[list[DbAndTheirTagNames]]
    url: Optional[list[str]]
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
