from typing import List, Union

from beanie import PydanticObjectId

from models.admin import Admin
from models.student import Student
from models.report_data import ReportData

admin_collection = Admin
student_collection = Student
report_data_collection = ReportData


async def add_admin(new_admin: Admin) -> Admin:
    admin = await new_admin.create()
    return admin


async def retrieve_students() -> List[Student]:
    students = await student_collection.all().to_list()
    return students

async def retrieve_report_data() -> List[ReportData]:
    report_data_list = await report_data_collection.all().to_list()
    return report_data_list

async def add_student(new_student: Student) -> Student:
    student = await new_student.create()
    return student

async def add_report_data(new_report_data: ReportData) -> ReportData:
    report_data = await new_report_data.create()
    return report_data

async def retrieve_student(id: PydanticObjectId) -> Student:
    student = await student_collection.get(id)
    if student:
        return student
    
async def retrieve_report_data_by_id(id: PydanticObjectId) -> ReportData:
    report_data = await report_data_collection.get(id)
    if report_data:
        return report_data


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
