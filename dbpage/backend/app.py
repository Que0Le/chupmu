from fastapi import FastAPI, Depends

from auth.jwt_bearer import JWTBearer
from config.config import initiate_database
from routes.admin import router as AdminRouter
from routes.student import router as StudentRouter
from routes.report_data import router as ReportDataRouter
from routes.report_meta import router as ReportMetaRouter
from fastapi.staticfiles import StaticFiles

app = FastAPI()

token_listener = JWTBearer()


@app.on_event("startup")
async def start_database():
    await initiate_database()


# @app.get("/", tags=["Root"])
# async def read_root():
#     return {"message": "Welcome to this fantastic app."}


app.include_router(AdminRouter, tags=["Administrator"], prefix="/admin")
app.include_router(
    StudentRouter, 
    tags=["Students"],
    prefix="/student",
    dependencies=[Depends(token_listener)],
)
app.include_router(
    ReportDataRouter,
    tags=["ReportData"],
    prefix="/report-data",
)
app.include_router(
    ReportMetaRouter,
    tags=["ReportMeta"],
    prefix="/report-meta",
)

app.mount('/', StaticFiles(directory="../basic-frontend", html=True), name="static")