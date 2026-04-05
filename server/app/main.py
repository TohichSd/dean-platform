import time

from fastapi import FastAPI
from sqlalchemy import text

from server.app.db.database import SessionLocal
from server.app.db.database import engine
from server.app.db.init_db import init_roles, init_admin
from server.app.db.models import Base
from server.app.routers import (
    auth,
    users,
    students,
    student,

    teachers,
    groups,
    departments,
    subjects,
    assessments,
    attempts,
    results,
    roles,
statistics
)

app = FastAPI(title="Session Accounting API")


@app.on_event("startup")
def startup():
    for _ in range(10):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))

            Base.metadata.create_all(bind=engine)

            db = SessionLocal()
            try:
                init_roles(db)
                init_admin(db)
            finally:
                db.close()

            print("БД полностью инициализирована")
            break

        except Exception as e:
            print(f"БД ещё не готова: {e}")
            time.sleep(2)


app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(teachers.router, prefix="/api")
app.include_router(groups.router, prefix="/api")
app.include_router(departments.router, prefix="/api")
app.include_router(subjects.router, prefix="/api")
app.include_router(assessments.router, prefix="/api")
app.include_router(attempts.router, prefix="/api")
app.include_router(results.router, prefix="/api")
app.include_router(roles.router, prefix="/api")
app.include_router(student.router, prefix="/api")
app.include_router(statistics.router, prefix="/api")