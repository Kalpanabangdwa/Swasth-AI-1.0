"""SQLAlchemy database models for Swasth AI."""
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base


def generate_uuid():
    return str(uuid.uuid4())


# ─────────────────────────────────────────────────────────────────────────────
# USER — full profile, identified by email (no passwords, no JWT)
# ─────────────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(String,  primary_key=True, default=generate_uuid)
    email = Column(String,  unique=True, nullable=False, index=True)
    name = Column(String,  nullable=True)

    # Profile info
    age = Column(Integer, nullable=True)
    weight_kg = Column(Float,   nullable=True)
    height_cm = Column(Float,   nullable=True)
    # weight_loss | weight_gain | maintenance
    goal = Column(String,  nullable=True)

    # Diet preferences
    # vegetarian | non-vegetarian | vegan
    preference = Column(String,  nullable=True)
    # comma-separated e.g. "nuts, dairy"
    allergies = Column(Text,    nullable=True)
    # sedentary | moderate | active
    activity_level = Column(String,  nullable=True)

    # Health conditions
    # e.g. "diabetes, hypertension"
    medical_conditions = Column(Text,    nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    # Relationships
    reports = relationship(
        "Report",      back_populates="user", cascade="all, delete-orphan")
    chat_history = relationship(
        "ChatHistory", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(email={self.email}, name={self.name})>"


# ─────────────────────────────────────────────────────────────────────────────
# CHAT HISTORY — every message stored, linked to user by email
# ─────────────────────────────────────────────────────────────────────────────
class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(String,   primary_key=True, default=generate_uuid)
    user_id = Column(String,   ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String,   nullable=False)   # "user" or "assistant"
    message = Column(Text,     nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow,
                       nullable=False, index=True)

    user = relationship("User", back_populates="chat_history")

    def __repr__(self):
        return f"<ChatHistory(user_id={self.user_id}, role={self.role})>"


# ─────────────────────────────────────────────────────────────────────────────
# EXISTING MODELS — completely unchanged
# ─────────────────────────────────────────────────────────────────────────────
class Report(Base):
    __tablename__ = "reports"

    id = Column(String,   primary_key=True, default=generate_uuid)
    user_id = Column(String,   ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String,   nullable=False)
    file_content = Column(Text,     nullable=False)
    extracted_text = Column(Text,     nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow,
                         nullable=False, index=True)
    category = Column(String,   nullable=False, default="General", index=True)
    health_score = Column(Integer,  nullable=False, default=0)

    user = relationship("User",       back_populates="reports")
    markers = relationship(
        "Marker",     back_populates="report", cascade="all, delete-orphan")
    deficiencies = relationship(
        "Deficiency", back_populates="report", cascade="all, delete-orphan")
    warnings = relationship(
        "Warning",    back_populates="report", cascade="all, delete-orphan")
    suggestions = relationship(
        "Suggestion", back_populates="report", cascade="all, delete-orphan")


class Marker(Base):
    __tablename__ = "markers"

    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey(
        "reports.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    value = Column(String, nullable=False)
    numeric_value = Column(Float,  nullable=True)
    unit = Column(String, nullable=True)
    status = Column(String, nullable=False, default="normal")
    reference_range = Column(String, nullable=True)

    report = relationship("Report", back_populates="markers")


class Deficiency(Base):
    __tablename__ = "deficiencies"

    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey(
        "reports.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)

    report = relationship("Report", back_populates="deficiencies")


class Warning(Base):
    __tablename__ = "warnings"

    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey(
        "reports.id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(String, nullable=False)

    report = relationship("Report", back_populates="warnings")


class Suggestion(Base):
    __tablename__ = "suggestions"

    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey(
        "reports.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(String, nullable=False)

    report = relationship("Report", back_populates="suggestions")
