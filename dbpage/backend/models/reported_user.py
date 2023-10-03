from typing import Optional, Any
from pymongo import IndexModel, TEXT
from beanie import Document, Indexed
from pydantic import BaseModel


class ReportedUser(Document):
    userid: Indexed(str, unique=True)
    tags: list[str]
    note: str
    platformUrl: str
    relatedPlatforms: list[str]

    class Settings:
        name = "reported_user"
        # indexes = [
        #     IndexModel(
        #         [("userid", TEXT), ("platformUrl", TEXT)],
        #         unique=True, 
        #         name="uid_platformurl_unique",
        #     )
        # ]   

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
