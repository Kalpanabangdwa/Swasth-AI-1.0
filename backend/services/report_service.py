"""Report service for CRUD operations on medical reports."""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
import base64

from models import Report, Marker, Deficiency, Warning, Suggestion, User
from encryption import encrypt_file_content, decrypt_file_content


class ReportService:
    """Service for managing medical reports."""
    
    def __init__(self, db_session: Session):
        """
        Initialize report service.
        
        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session
    
    async def create_report(
        self,
        user_id: str,
        filename: str,
        file_content: bytes,
        analysis_result: dict
    ) -> Report:
        """
        Store report and analysis in database.
        
        Args:
            user_id: User identifier
            filename: Original filename
            file_content: Raw file bytes
            analysis_result: Analysis results from AI
            
        Returns:
            Created Report object
        """
        # Encrypt file content
        encrypted_content = encrypt_file_content(file_content)
        
        # Create report record
        report = Report(
            user_id=user_id,
            filename=filename,
            file_content=encrypted_content,
            extracted_text=analysis_result.get("extracted_text", ""),
            category=analysis_result.get("category", "General"),
            health_score=analysis_result.get("health_score", 0),
            upload_date=datetime.utcnow()
        )
        
        self.db.add(report)
        self.db.flush()  # Get report ID
        
        # Add markers
        for marker_data in analysis_result.get("markers", []):
            marker = Marker(
                report_id=report.id,
                name=marker_data.get("name", ""),
                value=marker_data.get("value", ""),
                numeric_value=marker_data.get("num"),
                unit=marker_data.get("unit"),
                status=marker_data.get("status", "normal"),
                reference_range=marker_data.get("reference_range")
            )
            self.db.add(marker)
        
        # Add deficiencies
        for deficiency_name in analysis_result.get("deficiencies", []):
            deficiency = Deficiency(
                report_id=report.id,
                name=deficiency_name
            )
            self.db.add(deficiency)
        
        # Add warnings
        for warning_msg in analysis_result.get("warnings", []):
            warning = Warning(
                report_id=report.id,
                message=warning_msg
            )
            self.db.add(warning)
        
        # Add suggestions
        for suggestion_text in analysis_result.get("suggestions", []):
            suggestion = Suggestion(
                report_id=report.id,
                text=suggestion_text
            )
            self.db.add(suggestion)
        
        self.db.commit()
        self.db.refresh(report)
        
        return report
    
    async def get_reports(
        self,
        user_id: str,
        category: Optional[str] = None,
        limit: int = 10,
        offset: int = 0
    ) -> List[Report]:
        """
        Retrieve reports with optional filtering and pagination.
        
        Args:
            user_id: User identifier
            category: Optional category filter
            limit: Maximum number of reports to return
            offset: Number of reports to skip
            
        Returns:
            List of Report objects
        """
        query = self.db.query(Report).filter(Report.user_id == user_id)
        
        if category:
            query = query.filter(Report.category == category)
        
        reports = query.order_by(desc(Report.upload_date)).limit(limit).offset(offset).all()
        
        return reports
    
    async def get_report_by_id(
        self,
        report_id: str,
        user_id: str
    ) -> Optional[Report]:
        """
        Retrieve single report by ID with authorization check.
        
        Args:
            report_id: Report identifier
            user_id: User identifier for authorization
            
        Returns:
            Report object or None if not found or unauthorized
        """
        report = self.db.query(Report).filter(
            Report.id == report_id,
            Report.user_id == user_id
        ).first()
        
        return report
    
    async def delete_report(
        self,
        report_id: str,
        user_id: str
    ) -> bool:
        """
        Delete report and associated data with cascade.
        
        Args:
            report_id: Report identifier
            user_id: User identifier for authorization
            
        Returns:
            True if deleted, False if not found or unauthorized
        """
        report = await self.get_report_by_id(report_id, user_id)
        
        if not report:
            return False
        
        self.db.delete(report)
        self.db.commit()
        
        return True
    
    async def get_or_create_user(self, email: str) -> User:
        """
        Get existing user or create new one.
        
        Args:
            email: User email address
            
        Returns:
            User object
        """
        user = self.db.query(User).filter(User.email == email).first()
        
        if not user:
            user = User(email=email)
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        
        return user
    
    def get_report_count(self, user_id: str, category: Optional[str] = None) -> int:
        """
        Get total count of reports for pagination.
        
        Args:
            user_id: User identifier
            category: Optional category filter
            
        Returns:
            Total number of reports
        """
        query = self.db.query(Report).filter(Report.user_id == user_id)
        
        if category:
            query = query.filter(Report.category == category)
        
        return query.count()
