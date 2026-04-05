from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect
from backend.api.v1 import auth, records, analytics, users
from backend.core.config import settings
from backend.db.session import engine, Base
from backend.core.errors import AppError, app_error_handler
import traceback


def ensure_user_permission_columns() -> None:
    with engine.begin() as conn:
        inspector = inspect(conn)
        existing_columns = {column["name"] for column in inspector.get_columns("users")}

        if "is_promoted_admin" not in existing_columns:
            conn.exec_driver_sql(
                "ALTER TABLE users ADD COLUMN is_promoted_admin BOOLEAN NOT NULL DEFAULT FALSE"
            )
        if "permission_overrides" not in existing_columns:
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN permission_overrides VARCHAR")
        if "permission_expires_at" not in existing_columns:
            dt_type = "TIMESTAMP" if engine.dialect.name == "postgresql" else "DATETIME"
            conn.exec_driver_sql(f"ALTER TABLE users ADD COLUMN permission_expires_at {dt_type}")

# Create tables (SQLite)
Base.metadata.create_all(bind=engine)
ensure_user_permission_columns()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    debug=True
)

print(f"USING DB: {settings.DATABASE_URL}")

allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://([a-zA-Z0-9.-]+|\d{1,3}(?:\.\d{1,3}){3})(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Exception Handlers
@app.exception_handler(AppError)
async def custom_app_error_handler(request, exc):
    return await app_error_handler(request, exc)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    print("UNHANDLED EXCEPTION:")
    traceback.print_exc()
    if app.debug:
        message = f"{type(exc).__name__}: {exc}"
    else:
        message = "Internal server error"
    return await app_error_handler(request, AppError(message, 500, "INTERNAL_SERVER_ERROR"))

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(records.router, prefix=f"{settings.API_V1_STR}/records", tags=["records"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])

@app.get("/")
def root():
    return {"message": "Welcome to the Finance Operations API", "docs": "/docs"}
