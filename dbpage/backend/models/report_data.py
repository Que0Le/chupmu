from typing import Optional, Any, List

from beanie import Document
from pydantic import BaseModel, Field


# class FDbMetaData(BaseModel):
#     dbName: str
#     description: str
#     dbSource: str
#     onlineRecordUrlPrefix: str

# TODO: update json_schema_extra for each class after update

class DataUrlPayload(BaseModel):
    dataUrl: str
    description: str

# class DbAndTheirTagNames(BaseModel):
#     dbName: str
#     tagNames: list[str]


class ReportDataMeta(Document):
    reporter: str
    status: Optional[str] = Field(None, description="")
    reported_user: str
    note: str
    tags: list[str]
    urlRecorded: str
    platformUrl: str
    relatedPlatforms: list[str]
    unixTime: int
    # data_url_array: list[DataUrlPayload]

    # class Config:
    #     json_schema_extra = {
    #         "example": {
    #             "reporter": "r1",
    #             "reported_user": "u1",
    #             "filter_dbs": ["default_fdb1", "default_fdb2"],
    #             "url": "url1",
    #             "unixTime": 12345643232,
    #         }
    #     }

    class Settings:
        name = "report_data"


class ReportData(Document):
    reporter: str
    status: Optional[str] = Field(None, description="")
    reported_user: str
    note: str
    tags: list[str]
    urlRecorded: str
    platformUrl: str
    relatedPlatforms: list[str]
    unixTime: int
    data_url_array: list[DataUrlPayload]

    # class Config:
    #     json_schema_extra = {
    #         "example": {
    #             "reporter": "r1",
    #             "reported_user": "u1",
    #             "filter_dbs": ["default_fdb1", "default_fdb2"],
    #             "url": "url1",
    #             "unixTime": 12345643232,
    #             "data_url_array": [
    #                 {"description": "desc1", "dataUrl": "data_url_1"},
    #                 {"description": "desc2", "dataUrl": "data_url_2"}
    #             ],
    #         }
    #     }

    class Settings:
        name = "report_data"


# class ReportDataExtra(ReportData):
#     def __init__(self, reporter, reported_user, note,
#                  tags, urlRecorded, platformUrl,
#                  relatedPlatforms, unixTime, data_url_array, status
#     ):
#         super().__init__(reporter, reported_user, note,
#                         tags, urlRecorded, platformUrl,
#                         relatedPlatforms, unixTime, data_url_array)
#         self.status = status


# TODO: this  = Field(None, description="")
# is necessary, otherwise pydantic complains "Field required"
class UpdateReportDataModel(BaseModel):
    reporter: Optional[str] = Field(None, description="")
    status: Optional[str] = Field(None, description="")
    reported_user: Optional[str] = Field(None, description="")
    note: Optional[str] = Field(None, description="")
    tags: Optional[List[str]] = Field(None, description="")
    urlRecorded: Optional[str] = Field(None, description="")
    platformUrl: Optional[str] = Field(None, description="")
    relatedPlatforms: Optional[list[str]] = Field(None, description="")
    unixTime: Optional[int] = Field(None, description="")
    data_url_array: Optional[list[DataUrlPayload]
                             ] = Field(None, description="")

    class Collection:
        name = "report_data"


class Response(BaseModel):
    status_code: int
    response_type: str
    description: str
    data: Optional[Any]

    class Config:
        json_schema_extra = {
            "example": {
                "status_code": 200,
                "response_type": "success",
                "description": "Operation successful",
                "data": "Sample data",
            }
        }
