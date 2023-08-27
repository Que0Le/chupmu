from models.admin import Admin
from models.student import Student
from models.report_data import ReportData, ReportDataMeta

# Very important to include all models in used here.
# Without doing so, no db table will be created.
# Usuall error code: beanie.exceptions.CollectionWasNotInitialized
__all__ = [ReportDataMeta, ReportData, Student, Admin]
