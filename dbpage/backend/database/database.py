from typing import List, Union

from beanie import PydanticObjectId

from models.admin import Admin
from models.student import Student
from models.report_data import ReportData, ReportDataMeta
from models.reported_user import ReportedUser, ReportedUserQuery

admin_collection = Admin
student_collection = Student
report_data_collection = ReportData
report_meta_collection = ReportDataMeta
reported_user_collection = ReportedUser


async def add_admin(new_admin: Admin) -> Admin:
    admin = await new_admin.create()
    return admin


async def retrieve_students() -> List[Student]:
    students = await student_collection.all().to_list()
    return students


async def add_student(new_student: Student) -> Student:
    student = await new_student.create()
    return student


async def retrieve_student(id: PydanticObjectId) -> Student:
    student = await student_collection.get(id)
    if student:
        return student
    
async def delete_student(id: PydanticObjectId) -> bool:
    student = await student_collection.get(id)
    if student:
        await student.delete()
        return True

async def delete_report_data(id: PydanticObjectId) -> bool:
    report_data = await report_data_collection.get(id)
    if report_data:
        await report_data.delete()
        return True
    
async def update_student_data(id: PydanticObjectId, data: dict) -> Union[bool, Student]:
    des_body = {k: v for k, v in data.items() if v is not None}
    update_query = {"$set": {field: value for field, value in des_body.items()}}
    student = await student_collection.get(id)
    if student:
        await student.update(update_query)
        return student
    return False


async def add_report_data(new_report_data: ReportData) -> ReportData:
    report_data = await new_report_data.create()
    return report_data

async def retrieve_report_data_by_id(id: PydanticObjectId) -> ReportData:
    report_data = await report_data_collection.get(id)
    if report_data:
        return report_data

async def retrieve_report_data() -> List[ReportData]:
    report_data_list = await report_data_collection.all().to_list()
    return report_data_list

async def retrieve_report_meta() -> List[ReportDataMeta]:
    report_meta_list = await report_meta_collection.all().to_list()
    return report_meta_list

async def retrieve_report_meta_by_uid_and_platform(
    uid: str, platform_url: str
) -> List[ReportDataMeta]:
    print(uid, platform_url)
    report_meta_list = await report_meta_collection.all().find(
        ReportDataMeta.reported_user == uid,
        ReportDataMeta.platformUrl == platform_url
    ).to_list()
    return report_meta_list

async def add_reported_user(new_reported_user: ReportedUser) -> ReportedUser:
    reported_user = await new_reported_user.create()
    return reported_user

# async def add_many_reported_user(
#     new_reported_users: List[ReportedUser]
# ) -> List[ReportedUser]:
#     # prin      t(type(new_reported_users))
#     reported_users = await ReportedUser.insert_many(new_reported_users)
#     print("###")
#     print(reported_users)
#     print("###")
#     return reported_users

async def retrieve_reported_user_by_id(id: PydanticObjectId) -> ReportedUser:
    reported_user = await reported_user_collection.get(id)
    if reported_user:
        return reported_user

async def retrieve_reported_user_by_uid(uid: PydanticObjectId) -> ReportedUser:
    reported_user = await reported_user_collection.find(
        {"userid": uid}
    ).first_or_none()
    if reported_user:
        return reported_user

async def retrieve_reported_user_by_uid_and_platformurl(
    uid: str, platform_url: str
) -> ReportedUser:
    reported_user = await reported_user_collection.find(
        ReportedUser.userid == uid,
        ReportedUser.platformUrl == platform_url
    ).first_or_none()
    if reported_user:
        return reported_user

async def retrieve_many_reported_users_by_uid_and_platformurl(
    ruqs: list[ReportedUserQuery]
) -> list[ReportedUser]:
    reported_users = []
    for ruq in ruqs:
        reported_user = await reported_user_collection.find(
            ReportedUser.userid == ruq.userid,
            ReportedUser.platformUrl == ruq.platformUrl
        ).first_or_none()
        if reported_user:
            reported_users.append(reported_user) 
    return reported_users

