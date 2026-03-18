"""Trend service for historical health marker analysis."""
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from collections import defaultdict

from models import Report, Marker


class TrendAnalysis:
    """Data class for trend analysis results."""
    
    def __init__(
        self,
        marker_name: str,
        direction: str,
        data_points: List[Dict],
        concerning: bool
    ):
        self.marker_name = marker_name
        self.direction = direction  # improving, declining, stable
        self.data_points = data_points
        self.concerning = concerning


class TrendService:
    """Service for analyzing health trends across multiple reports."""
    
    def __init__(self, db_session: Session):
        """
        Initialize trend service.
        
        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session
    
    def calculate_marker_trends(
        self,
        user_id: str,
        marker_name: str,
        time_period: str = "all"
    ) -> Optional[TrendAnalysis]:
        """
        Calculate trend for specific marker over time.
        
        Args:
            user_id: User identifier
            marker_name: Name of the marker to analyze
            time_period: Time period filter (3m, 6m, 1y, all)
            
        Returns:
            TrendAnalysis object or None if insufficient data
        """
        # Get reports within time period
        reports = self._get_reports_in_period(user_id, time_period)
        
        if len(reports) < 2:
            return None
        
        # Extract marker values from reports
        data_points = []
        
        for report in reports:
            for marker in report.markers:
                if marker.name.lower() == marker_name.lower():
                    if marker.numeric_value is not None:
                        data_points.append({
                            "date": report.upload_date.isoformat(),
                            "value": marker.numeric_value,
                            "status": marker.status,
                            "report_id": report.id
                        })
                    break
        
        if len(data_points) < 2:
            return None
        
        # Sort by date
        data_points.sort(key=lambda x: x["date"])
        
        # Calculate trend direction
        direction = self._calculate_direction(data_points)
        
        # Check if trend is concerning
        concerning = self._is_concerning_trend(data_points, direction)
        
        return TrendAnalysis(
            marker_name=marker_name,
            direction=direction,
            data_points=data_points,
            concerning=concerning
        )
    
    def get_all_trends(
        self,
        user_id: str,
        time_period: str = "all"
    ) -> Dict[str, TrendAnalysis]:
        """
        Get trends for all markers.
        
        Args:
            user_id: User identifier
            time_period: Time period filter (3m, 6m, 1y, all)
            
        Returns:
            Dictionary mapping marker names to TrendAnalysis objects
        """
        # Get all unique marker names for user
        reports = self._get_reports_in_period(user_id, time_period)
        
        marker_names = set()
        for report in reports:
            for marker in report.markers:
                marker_names.add(marker.name)
        
        # Calculate trends for each marker
        trends = {}
        for marker_name in marker_names:
            trend = self.calculate_marker_trends(user_id, marker_name, time_period)
            if trend:
                trends[marker_name] = trend
        
        return trends
    
    def identify_concerning_trends(
        self,
        trends: Dict[str, TrendAnalysis]
    ) -> List[str]:
        """
        Identify markers with concerning trends.
        
        Args:
            trends: Dictionary of trend analyses
            
        Returns:
            List of marker names with concerning trends
        """
        concerning_markers = []
        
        for marker_name, trend in trends.items():
            if trend.concerning:
                concerning_markers.append(marker_name)
        
        return concerning_markers
    
    def compare_reports(
        self,
        user_id: str,
        report_ids: List[str]
    ) -> Dict[str, List[Dict]]:
        """
        Compare multiple reports side-by-side.
        
        Args:
            user_id: User identifier
            report_ids: List of report IDs to compare (2-4 reports)
            
        Returns:
            Dictionary mapping marker names to comparison data
        """
        if len(report_ids) < 2 or len(report_ids) > 4:
            raise ValueError("Can only compare 2-4 reports")
        
        # Fetch reports
        reports = self.db.query(Report).filter(
            and_(
                Report.id.in_(report_ids),
                Report.user_id == user_id
            )
        ).all()
        
        if len(reports) != len(report_ids):
            raise ValueError("Some reports not found or unauthorized")
        
        # Sort reports by date
        reports.sort(key=lambda r: r.upload_date)
        
        # Group markers by name
        marker_data = defaultdict(list)
        
        for report in reports:
            report_markers = {m.name: m for m in report.markers}
            
            # Get all unique marker names across all reports
            all_marker_names = set()
            for r in reports:
                all_marker_names.update(m.name for m in r.markers)
            
            for marker_name in all_marker_names:
                marker = report_markers.get(marker_name)
                
                if marker:
                    marker_data[marker_name].append({
                        "report_id": report.id,
                        "date": report.upload_date.isoformat(),
                        "value": marker.numeric_value,
                        "value_str": marker.value,
                        "status": marker.status,
                        "unit": marker.unit
                    })
                else:
                    # Marker not present in this report
                    marker_data[marker_name].append({
                        "report_id": report.id,
                        "date": report.upload_date.isoformat(),
                        "value": None,
                        "value_str": "N/A",
                        "status": "missing",
                        "unit": None
                    })
        
        # Calculate percentage changes
        for marker_name, values in marker_data.items():
            numeric_values = [v["value"] for v in values if v["value"] is not None]
            
            if len(numeric_values) >= 2:
                first_val = numeric_values[0]
                last_val = numeric_values[-1]
                
                if first_val != 0:
                    pct_change = ((last_val - first_val) / first_val) * 100
                else:
                    pct_change = 0
                
                # Add trend info
                for value_dict in values:
                    value_dict["percentage_change"] = round(pct_change, 1)
                    value_dict["trend"] = "increasing" if pct_change > 5 else "decreasing" if pct_change < -5 else "stable"
        
        return dict(marker_data)
    
    def _get_reports_in_period(
        self,
        user_id: str,
        time_period: str
    ) -> List[Report]:
        """Get reports within specified time period."""
        query = self.db.query(Report).filter(Report.user_id == user_id)
        
        if time_period != "all":
            # Calculate cutoff date
            now = datetime.utcnow()
            
            if time_period == "3m":
                cutoff = now - timedelta(days=90)
            elif time_period == "6m":
                cutoff = now - timedelta(days=180)
            elif time_period == "1y":
                cutoff = now - timedelta(days=365)
            else:
                cutoff = None
            
            if cutoff:
                query = query.filter(Report.upload_date >= cutoff)
        
        return query.order_by(Report.upload_date).all()
    
    def _calculate_direction(self, data_points: List[Dict]) -> str:
        """
        Calculate trend direction from data points.
        
        Args:
            data_points: List of data points with values
            
        Returns:
            Direction string: improving, declining, or stable
        """
        if len(data_points) < 2:
            return "stable"
        
        values = [dp["value"] for dp in data_points]
        
        # Calculate simple linear trend
        n = len(values)
        x = list(range(n))
        
        # Calculate slope using least squares
        x_mean = sum(x) / n
        y_mean = sum(values) / n
        
        numerator = sum((x[i] - x_mean) * (values[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
        
        if denominator == 0:
            return "stable"
        
        slope = numerator / denominator
        
        # Determine direction based on slope and status
        # For markers where lower is better (like cholesterol), declining is improving
        # For markers where higher is better (like hemoglobin), increasing is improving
        
        # Check if most recent status is abnormal
        recent_status = data_points[-1]["status"]
        
        if abs(slope) < 0.1:  # Threshold for stability
            return "stable"
        elif slope > 0:
            # Increasing trend
            if recent_status == "high":
                return "declining"  # Getting worse
            else:
                return "improving"  # Getting better
        else:
            # Decreasing trend
            if recent_status == "low":
                return "declining"  # Getting worse
            else:
                return "improving"  # Getting better
    
    def _is_concerning_trend(
        self,
        data_points: List[Dict],
        direction: str
    ) -> bool:
        """
        Check if trend is concerning.
        
        Args:
            data_points: List of data points
            direction: Trend direction
            
        Returns:
            True if trend is concerning
        """
        # Trend is concerning if:
        # 1. Direction is declining
        # 2. Multiple consecutive abnormal readings
        # 3. Values are moving away from normal range
        
        if direction == "declining":
            return True
        
        # Check for consecutive abnormal readings
        abnormal_count = sum(1 for dp in data_points[-3:] if dp["status"] != "normal")
        
        if abnormal_count >= 2:
            return True
        
        return False
