"""SQLAlchemy database models for medical reports."""
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base


def generate_uuid():
    """Generate a unique ID."""
    return str(uuid.uuid4())


class User(Base):
    """User model for storing user information."""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"


class Report(Base):
    """Report model for storing medical reports."""
    __tablename__ = "reports"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    file_content = Column(Text, nullable=False)  # Base64 encoded
    extracted_text = Column(Text, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    category = Column(String, nullable=False, default="General", index=True)
    health_score = Column(Integer, nullable=False, default=0)
    
    # Relationships
    user = relationship("User", back_populates="reports")
    markers = relationship("Marker", back_populates="report", cascade="all, delete-orphan")
    deficiencies = relationship("Deficiency", back_populates="report", cascade="all, delete-orphan")
    warnings = relationship("Warning", back_populates="report", cascade="all, delete-orphan")
    suggestions = relationship("Suggestion", back_populates="report", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Report(id={self.id}, filename={self.filename}, category={self.category})>"


class Marker(Base):
    """Marker model for storing health markers extracted from reports."""
    __tablename__ = "markers"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    value = Column(String, nullable=False)
    numeric_value = Column(Float, nullable=True)
    unit = Column(String, nullable=True)
    status = Column(String, nullable=False, default="normal")  # low, normal, high
    reference_range = Column(String, nullable=True)
    
    # Relationships
    report = relationship("Report", back_populates="markers")
    
    def __repr__(self):
        return f"<Marker(name={self.name}, value={self.value}, status={self.status})>"


class Deficiency(Base):
    """Deficiency model for storing identified deficiencies."""
    __tablename__ = "deficiencies"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    
    # Relationships
    report = relationship("Report", back_populates="deficiencies")
    
    def __repr__(self):
        return f"<Deficiency(name={self.name})>"


class Warning(Base):
    """Warning model for storing health warnings."""
    __tablename__ = "warnings"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(String, nullable=False)
    
    # Relationships
    report = relationship("Report", back_populates="warnings")
    
    def __repr__(self):
        return f"<Warning(message={self.message[:50]})>"


class Suggestion(Base):
    """Suggestion model for storing dietary and health suggestions."""
    __tablename__ = "suggestions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(String, nullable=False)
    
    # Relationships
    report = relationship("Report", back_populates="suggestions")
    
    def __repr__(self):
        return f"<Suggestion(text={self.text[:50]})>"
