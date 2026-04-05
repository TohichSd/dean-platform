from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Role(Base):
    __tablename__ = "roles"

    role_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    role_name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)

    users: Mapped[list["User"]] = relationship(back_populates="role")


class Department(Base):
    __tablename__ = "department"

    department_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    department_name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)

    teachers: Mapped[list["Teacher"]] = relationship(back_populates="department")


class Subject(Base):
    __tablename__ = "subject"

    subject_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    subject_name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)

    assessments: Mapped[list["Assessment"]] = relationship(back_populates="subject")


class StudyGroup(Base):
    __tablename__ = "study_group"

    group_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    group_name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)

    students: Mapped[list["Student"]] = relationship(back_populates="group")
    assessments: Mapped[list["Assessment"]] = relationship(back_populates="group")


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    surname: Mapped[str | None] = mapped_column(String(100), nullable=True)
    login: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    password_salt: Mapped[str] = mapped_column(String(255), nullable=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.role_id"), nullable=False)

    role: Mapped["Role"] = relationship(back_populates="users")
    student: Mapped["Student | None"] = relationship(back_populates="user", uselist=False)
    teacher: Mapped["Teacher | None"] = relationship(back_populates="user", uselist=False)


class Student(Base):
    __tablename__ = "student"

    student_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("study_group.group_id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False, unique=True)

    group: Mapped["StudyGroup"] = relationship(back_populates="students")
    user: Mapped["User"] = relationship(back_populates="student")
    attempts: Mapped[list["Attempt"]] = relationship(back_populates="student")


class Teacher(Base):
    __tablename__ = "teacher"

    teacher_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("department.department_id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False, unique=True)

    department: Mapped["Department"] = relationship(back_populates="teachers")
    user: Mapped["User"] = relationship(back_populates="teacher")
    assessments: Mapped[list["Assessment"]] = relationship(back_populates="teacher")


class Assessment(Base):
    __tablename__ = "assessment"

    assessment_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("study_group.group_id"), nullable=False)
    is_exam: Mapped[bool] = mapped_column(Boolean, nullable=False)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teacher.teacher_id"), nullable=False)
    assessment_dt: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_retake: Mapped[bool] = mapped_column(Boolean, nullable=False)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subject.subject_id"), nullable=False)

    group: Mapped["StudyGroup"] = relationship(back_populates="assessments")
    teacher: Mapped["Teacher"] = relationship(back_populates="assessments")
    subject: Mapped["Subject"] = relationship(back_populates="assessments")
    attempts: Mapped[list["Attempt"]] = relationship(back_populates="assessment")


class Attempt(Base):
    __tablename__ = "attempt"

    attempt_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    assessment_id: Mapped[int] = mapped_column(ForeignKey("assessment.assessment_id"), nullable=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("student.student_id"), nullable=False)

    assessment: Mapped["Assessment"] = relationship(back_populates="attempts")
    student: Mapped["Student"] = relationship(back_populates="attempts")
    result: Mapped["Result | None"] = relationship(back_populates="attempt", uselist=False)


class Result(Base):
    __tablename__ = "result"
    __table_args__ = (
        CheckConstraint("result_value BETWEEN 2 AND 5", name="chk_result_value"),
    )

    result_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    result_value: Mapped[int | None] = mapped_column(Integer, nullable=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("attempt.attempt_id"), nullable=False, unique=True)
    is_absent: Mapped[bool] = mapped_column(Boolean, nullable=False)

    attempt: Mapped["Attempt"] = relationship(back_populates="result")
