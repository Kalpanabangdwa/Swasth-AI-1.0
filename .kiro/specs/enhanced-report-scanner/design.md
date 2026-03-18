# Design Document: Enhanced Report Scanner

## Overview

The Enhanced Report Scanner extends the existing medical report analysis system with comprehensive data persistence, multi-report comparison, export functionality, improved AI analysis, robust error handling, automatic categorization, historical tracking, accessibility features, and performance optimizations. The system maintains the current architecture using React frontend with FastAPI backend, PyMuPDF for text extraction, and HuggingFace Mistral-7B for AI-powered analysis.

The design follows a layered architecture with clear separation between presentation (React), business logic (FastAPI services), and data persistence (database layer). All AI operations leverage the HuggingFace API with proper error handling and retry mechanisms.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Report       │  │ Comparison   │  │ Timeline     │     │
│  │ Scanner      │  │ View         │  │ View         │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Report       │  │ Analysis     │  │ Export       │     │
│  │ Service      │  │ Service      │  │ Service      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │ Category     │  │ Trend        │                       │
│  │ Service      │  │ Service      │                       │
│  └──────────────┘  └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────┐    ┌──────────────────────┐
│   Database Layer     │    │  HuggingFace API     │
│   (SQLite/Postgres)  │    │  (Mistral-7B)        │
└──────────────────────┘    └──────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with functional components and hooks
- Recharts for data visualization
- Lucide React for icons
- Browser localStorage for caching
- Fetch API for HTTP requests

**Backend:**
- FastAPI for REST API endpoints
- PyMuPDF (fitz) for PDF text extraction
- SQLAlchemy for database ORM
- Pydantic for data validation
- ReportLab for PDF generation
- SMTP for email delivery

**External Services:**
- HuggingFace Inference API (Mistral-7B-Instruct-v0.2)

**Database:**
- SQLite for development
- PostgreSQL for production

## Components and Interfaces

### Frontend Components

#### ReportScanner Component

Enhanced version of the existing component with new capabilities:

```typescript
interface ReportScannerProps {
  userId: string;
}

interface Report {
  id: string;
  filename: string;
  uploadDate: string;
  category: string;
  healthScore: number;
  markers: Marker[];
  deficiencies: string[];
  warnings: string[];
  suggestions: string[];
}

interface Marker {
  name: string;
  value: string;
  numericValue: number | null;
  unit: string;
  status: 'low' | 'normal' | 'high';
  referenceRange?: string;
}

// Main component methods
function uploadReport(file: File): Promise<Report>
function loadReports(): Promise<Report[]>
function deleteReport(reportId: string): Promise<void>
function filterByCategory(category: string): Report[]
function exportReport(reportId: string, format: 'pdf' | 'email'): Promise<void>
```

#### ComparisonView Component

New component for side-by-side report comparison:

```typescript
interface ComparisonViewProps {
  reports: Report[];
  maxReports?: number; // default 4
}

interface MarkerComparison {
  markerName: string;
  values: Array<{
    reportId: string;
    date: string;
    value: number;
    status: string;
  }>;
  trend: 'improving' | 'declining' | 'stable';
  percentageChange: number;
}

function compareReports(reportIds: string[]): MarkerComparison[]
function calculateTrend(values: number[]): 'improving' | 'declining' | 'stable'
function highlightChanges(comparison: MarkerComparison): React.ReactNode
```

#### TimelineView Component

New component for historical report timeline:

```typescript
interface TimelineViewProps {
  reports: Report[];
  timePeriod: '3m' | '6m' | '1y' | 'all';
}

interface TimelineGroup {
  month: string;
  year: number;
  reports: Report[];
}

function groupByMonth(reports: Report[]): TimelineGroup[]
function filterByPeriod(reports: Report[], period: string): Report[]
function renderTimeline(groups: TimelineGroup[]): React.ReactNode
```

### Backend Services

#### ReportService

Handles report CRUD operations and database interactions:

```python
class ReportService:
    def __init__(self, db_session: Session):
        self.db = db_session
    
    async def create_report(
        self,
        user_id: str,
        filename: str,
        file_content: bytes,
        analysis_result: dict
    ) -> Report:
        """Store report and analysis in database"""
        pass
    
    async def get_reports(
        self,
        user_id: str,
        category: Optional[str] = None,
        limit: int = 10,
        offset: int = 0
    ) -> List[Report]:
        """Retrieve reports with optional filtering and pagination"""
        pass
    
    async def get_report_by_id(
        self,
        report_id: str,
        user_id: str
    ) -> Optional[Report]:
        """Retrieve single report by ID"""
        pass
    
    async def delete_report(
        self,
        report_id: str,
        user_id: str
    ) -> bool:
        """Delete report and associated data"""
        pass
```

#### AnalysisService

Enhanced AI analysis with improved marker extraction and validation:

```python
class AnalysisService:
    def __init__(self, hf_token: str):
        self.hf_token = hf_token
        self.api_url = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
        self.circuit_breaker = CircuitBreaker(failure_threshold=3, timeout=60)
    
    async def analyze_report(
        self,
        extracted_text: str
    ) -> AnalysisResult:
        """
        Analyze report text using HuggingFace API
        Returns structured analysis with markers, deficiencies, warnings
        """
        pass
    
    async def extract_markers(
        self,
        text: str
    ) -> List[Marker]:
        """Extract health markers with values and units"""
        pass
    
    def validate_marker_ranges(
        self,
        markers: List[Marker]
    ) -> List[Marker]:
        """Validate markers against reference ranges"""
        pass
    
    def calculate_health_score(
        self,
        markers: List[Marker],
        warnings: List[str]
    ) -> int:
        """Calculate health score (0-100)"""
        pass
    
    async def call_huggingface_with_retry(
        self,
        prompt: str,
        max_retries: int = 3
    ) -> str:
        """Call HuggingFace API with exponential backoff retry"""
        pass
```

#### CategoryService

Automatic report categorization using AI:

```python
class CategoryService:
    CATEGORIES = [
        "Blood Test",
        "Radiology",
        "Pathology",
        "Cardiology",
        "Endocrinology",
        "General"
    ]
    
    def __init__(self, hf_token: str):
        self.hf_token = hf_token
    
    async def categorize_report(
        self,
        extracted_text: str,
        markers: List[Marker]
    ) -> str:
        """
        Categorize report using HuggingFace API
        Returns category name with confidence score
        """
        pass
    
    def build_categorization_prompt(
        self,
        text: str,
        markers: List[Marker]
    ) -> str:
        """Build prompt for category classification"""
        pass
```

#### TrendService

Analyzes health trends across multiple reports:

```python
class TrendService:
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def calculate_marker_trends(
        self,
        user_id: str,
        marker_name: str,
        time_period: str
    ) -> TrendAnalysis:
        """Calculate trend for specific marker over time"""
        pass
    
    def get_all_trends(
        self,
        user_id: str,
        time_period: str
    ) -> Dict[str, TrendAnalysis]:
        """Get trends for all markers"""
        pass
    
    def identify_concerning_trends(
        self,
        trends: Dict[str, TrendAnalysis]
    ) -> List[str]:
        """Identify markers with concerning trends"""
        pass
```

#### ExportService

Generates PDF exports and handles email delivery:

```python
class ExportService:
    def __init__(self, smtp_config: dict):
        self.smtp_config = smtp_config
    
    async def generate_pdf(
        self,
        report: Report
    ) -> bytes:
        """Generate PDF export of report analysis"""
        pass
    
    async def send_email(
        self,
        recipient: str,
        report: Report,
        pdf_content: bytes,
        max_retries: int = 3
    ) -> bool:
        """Send report via email with retry logic"""
        pass
    
    def format_pdf_content(
        self,
        report: Report
    ) -> List[ReportLabElement]:
        """Format report data for PDF generation"""
        pass
```

### API Endpoints

```python
# Report Management
POST   /api/reports/upload          # Upload and analyze new report
GET    /api/reports                 # List reports with pagination
GET    /api/reports/{report_id}     # Get single report
DELETE /api/reports/{report_id}     # Delete report

# Comparison and Trends
POST   /api/reports/compare         # Compare multiple reports
GET    /api/reports/trends          # Get trend analysis

# Export
POST   /api/reports/{report_id}/export/pdf    # Export as PDF
POST   /api/reports/{report_id}/export/email  # Send via email

# Categories
GET    /api/categories              # List available categories
GET    /api/reports/category/{name} # Filter by category
```

## Data Models

### Database Schema

```python
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_content = Column(Text, nullable=False)  # Base64 encoded
    extracted_text = Column(Text, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    category = Column(String, nullable=False)
    health_score = Column(Integer, nullable=False)
    
    user = relationship("User", back_populates="reports")
    markers = relationship("Marker", back_populates="report", cascade="all, delete-orphan")
    deficiencies = relationship("Deficiency", back_populates="report", cascade="all, delete-orphan")
    warnings = relationship("Warning", back_populates="report", cascade="all, delete-orphan")
    suggestions = relationship("Suggestion", back_populates="report", cascade="all, delete-orphan")

class Marker(Base):
    __tablename__ = "markers"
    
    id = Column(String, primary_key=True)
    report_id = Column(String, ForeignKey("reports.id"), nullable=False)
    name = Column(String, nullable=False)
    value = Column(String, nullable=False)
    numeric_value = Column(Float, nullable=True)
    unit = Column(String, nullable=True)
    status = Column(String, nullable=False)  # low, normal, high
    reference_range = Column(String, nullable=True)
    
    report = relationship("Report", back_populates="markers")

class Deficiency(Base):
    __tablename__ = "deficiencies"
    
    id = Column(String, primary_key=True)
    report_id = Column(String, ForeignKey("reports.id"), nullable=False)
    name = Column(String, nullable=False)
    
    report = relationship("Report", back_populates="deficiencies")

class Warning(Base):
    __tablename__ = "warnings"
    
    id = Column(String, primary_key=True)
    report_id = Column(String, ForeignKey("reports.id"), nullable=False)
    message = Column(String, nullable=False)
    
    report = relationship("Report", back_populates="warnings")

class Suggestion(Base):
    __tablename__ = "suggestions"
    
    id = Column(String, primary_key=True)
    report_id = Column(String, ForeignKey("reports.id"), nullable=False)
    text = Column(String, nullable=False)
    
    report = relationship("Report", back_populates="suggestions")
```

### Pydantic Models

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class MarkerSchema(BaseModel):
    name: str
    value: str
    numeric_value: Optional[float] = None
    unit: Optional[str] = None
    status: str = Field(..., pattern="^(low|normal|high)$")
    reference_range: Optional[str] = None

class AnalysisResultSchema(BaseModel):
    markers: List[MarkerSchema]
    deficiencies: List[str]
    warnings: List[str]
    suggestions: List[str]
    health_score: int = Field(..., ge=0, le=100)
    category: str

class ReportSchema(BaseModel):
    id: str
    filename: str
    upload_date: datetime
    category: str
    health_score: int
    markers: List[MarkerSchema]
    deficiencies: List[str]
    warnings: List[str]
    suggestions: List[str]
    
    class Config:
        from_attributes = True

class ReportUploadResponse(BaseModel):
    report: ReportSchema
    message: str

class ComparisonSchema(BaseModel):
    marker_name: str
    values: List[dict]
    trend: str
    percentage_change: float

class TrendAnalysisSchema(BaseModel):
    marker_name: str
    direction: str  # improving, declining, stable
    data_points: List[dict]
    concerning: bool
```

## Error Handling

### Circuit Breaker Pattern

```python
class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half_open
    
    def call(self, func, *args, **kwargs):
        if self.state == "open":
            if time.time() - self.last_failure_time > self.timeout:
                self.state = "half_open"
            else:
                raise CircuitBreakerOpenError("Circuit breaker is open")
        
        try:
            result = func(*args, **kwargs)
            if self.state == "half_open":
                self.state = "closed"
                self.failure_count = 0
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = "open"
            raise e
```

### Retry Logic with Exponential Backoff

```python
async def retry_with_backoff(
    func,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0
):
    """
    Retry function with exponential backoff
    Delay = min(base_delay * (2 ** attempt), max_delay)
    """
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            
            delay = min(base_delay * (2 ** attempt), max_delay)
            await asyncio.sleep(delay)
```

### Error Response Format

```python
class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[dict] = None
    retry_after: Optional[int] = None  # seconds

# Example error responses
{
    "error": "HuggingFaceAPIError",
    "message": "Failed to analyze report after 3 attempts",
    "details": {"last_error": "Connection timeout"},
    "retry_after": 60
}

{
    "error": "ValidationError",
    "message": "PDF file contains no extractable text",
    "details": {"filename": "scan.pdf", "text_length": 5}
}
```

## Performance Optimizations

### Frontend Caching Strategy

```typescript
// Cache structure in localStorage
interface CacheEntry {
  data: Report[];
  timestamp: number;
  ttl: number; // milliseconds
}

class ReportCache {
  private static TTL = 3600000; // 1 hour
  
  static set(key: string, data: Report[]): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: this.TTL
    };
    localStorage.setItem(key, JSON.stringify(entry));
  }
  
  static get(key: string): Report[] | null {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const entry: CacheEntry = JSON.parse(item);
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(key);
      return null;
    }
    
    return entry.data;
  }
}
```

### Lazy Loading Implementation

```typescript
function useInfiniteReports(userId: string) {
  const [reports, setReports] = useState<Report[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    const newReports = await fetchReports(userId, page * 10, 10);
    
    if (newReports.length < 10) {
      setHasMore(false);
    }
    
    setReports(prev => [...prev, ...newReports]);
    setPage(prev => prev + 1);
    setLoading(false);
  };
  
  return { reports, loadMore, hasMore, loading };
}
```

### Backend Caching

```python
from functools import lru_cache
from cachetools import TTLCache
import hashlib

# In-memory cache with TTL
analysis_cache = TTLCache(maxsize=100, ttl=3600)

def get_cache_key(text: str) -> str:
    """Generate cache key from text content"""
    return hashlib.sha256(text.encode()).hexdigest()

async def analyze_with_cache(text: str) -> AnalysisResult:
    cache_key = get_cache_key(text)
    
    if cache_key in analysis_cache:
        return analysis_cache[cache_key]
    
    result = await analyze_report(text)
    analysis_cache[cache_key] = result
    
    return result
```

## Accessibility Implementation

### ARIA Labels and Roles

```typescript
// Report card with proper ARIA attributes
<div
  role="article"
  aria-label={`Medical report ${report.filename} uploaded on ${report.uploadDate}`}
  tabIndex={0}
>
  <button
    aria-label={`Delete report ${report.filename}`}
    onClick={() => handleDelete(report.id)}
  >
    <Trash2 aria-hidden="true" />
  </button>
  
  <button
    aria-label={`Export report ${report.filename} as PDF`}
    onClick={() => handleExport(report.id)}
  >
    <Download aria-hidden="true" />
  </button>
</div>

// Loading state announcement
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {loading && "Analyzing report, please wait..."}
</div>
```

### Keyboard Navigation

```typescript
function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + U: Upload
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        triggerFileUpload();
      }
      
      // Ctrl/Cmd + E: Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportCurrentReport();
      }
      
      // Ctrl/Cmd + C: Compare
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        openComparisonView();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### PDF Processing Properties

**Property 1: Valid PDF text extraction**
*For any* PDF file with extractable text content, the Report_Scanner should successfully extract non-empty text using PyMuPDF.
**Validates: Requirements 1.1**

**Property 2: Invalid file type rejection**
*For any* file with a non-PDF extension, the Report_Scanner should reject the file and return an error message indicating only PDFs are supported.
**Validates: Requirements 1.2**

**Property 3: File size validation**
*For any* file, if its size is less than or equal to 10MB, it should be accepted; if greater than 10MB, it should be rejected with an appropriate error.
**Validates: Requirements 1.4**

**Property 4: Minimum text length validation**
*For any* extracted text, if its length is less than 30 characters, the system should reject it before proceeding to analysis.
**Validates: Requirements 1.7**

**Property 5: Analysis pipeline integration**
*For any* successfully extracted text, the Analysis_Engine should invoke the HuggingFace API with that text.
**Validates: Requirements 1.6**

### Comparison and Trend Properties

**Property 6: Marker alignment in comparison**
*For any* set of 2 to 4 reports, the Comparison_View should display all common markers aligned side-by-side.
**Validates: Requirements 2.1**

**Property 7: Change detection**
*For any* two reports with the same marker, if the marker values differ, the Comparison_View should highlight the change.
**Validates: Requirements 2.2**

**Property 8: Change direction indication**
*For any* marker that changes between reports, the Comparison_View should indicate whether the value increased or decreased with appropriate visual styling.
**Validates: Requirements 2.3, 2.4**

**Property 9: Percentage change calculation**
*For any* numerical marker appearing in multiple reports, the calculated percentage change should equal ((new_value - old_value) / old_value) * 100.
**Validates: Requirements 2.5**

**Property 10: Time difference calculation**
*For any* two reports with different dates, the displayed time difference should accurately reflect the duration between upload dates.
**Validates: Requirements 2.6**

### Data Persistence Properties

**Property 11: Report persistence completeness**
*For any* uploaded report and its analysis results, both the original file content and all analysis components (markers, deficiencies, warnings, suggestions) should be persisted to the database.
**Validates: Requirements 3.1, 3.2**

**Property 12: Report retrieval completeness**
*For any* user, retrieving their reports should return all and only the reports they have uploaded.
**Validates: Requirements 3.3, 3.4**

**Property 13: Data encryption at rest**
*For any* stored report, sensitive health data fields in the database should be encrypted and not readable as plain text.
**Validates: Requirements 3.5**

**Property 14: Referential integrity**
*For any* report, all associated analysis data (markers, deficiencies, warnings, suggestions) should have foreign key relationships to the report, and orphaned records should not exist.
**Validates: Requirements 3.6**

**Property 15: Cascade deletion**
*For any* report, when it is deleted, all associated analysis data should also be removed from the database.
**Validates: Requirements 3.7**

### Export and Sharing Properties

**Property 16: PDF export generation**
*For any* report, triggering export should generate a valid PDF file containing the report analysis.
**Validates: Requirements 4.1**

**Property 17: Export completeness**
*For any* exported PDF, it should contain all markers, deficiencies, warnings, and suggestions from the original analysis.
**Validates: Requirements 4.2**

**Property 18: Email delivery**
*For any* valid email address, the Export_Service should send the analysis PDF to that address.
**Validates: Requirements 4.4**

**Property 19: Email content completeness**
*For any* email sent, the body should include a summary containing key findings from the report.
**Validates: Requirements 4.5**

**Property 20: Email retry with exponential backoff**
*For any* failed email delivery, the system should retry up to 3 times with delays following exponential backoff (1s, 2s, 4s).
**Validates: Requirements 4.6**

### AI Analysis Enhancement Properties

**Property 21: Reference range validation**
*For any* marker with a known reference range, if the marker value falls outside that range, it should be flagged as abnormal.
**Validates: Requirements 5.2, 5.3**

**Property 22: Low confidence flagging**
*For any* marker extraction with confidence below 70%, the marker should be flagged for user review.
**Validates: Requirements 5.5**

**Property 23: Marker name normalization**
*For any* marker name variant (e.g., "Vit D", "Vitamin D", "VitaminD"), the Analysis_Engine should normalize it to the standard medical term.
**Validates: Requirements 5.6**

**Property 24: Date extraction and association**
*For any* report containing date information, the Analysis_Engine should extract the date and associate it with the report record.
**Validates: Requirements 5.7**

### Error Handling Properties

**Property 25: User-friendly error messages**
*For any* analysis failure, the Report_Scanner should display an error message that is understandable to non-technical users.
**Validates: Requirements 6.1**

**Property 26: API retry with exponential backoff**
*For any* HuggingFace API failure, the Analysis_Engine should retry up to 3 times with exponential backoff delays.
**Validates: Requirements 6.2**

**Property 27: Graceful degradation**
*For any* complete API failure after all retries, the Analysis_Engine should return a partial result containing at least the extracted text.
**Validates: Requirements 6.3**

**Property 28: Upload retry capability**
*For any* network error during upload, the Report_Scanner should provide a retry option to the user.
**Validates: Requirements 6.4**

**Property 29: Pre-upload validation**
*For any* file, the Report_Scanner should validate size and format before initiating the upload request.
**Validates: Requirements 6.5**

**Property 30: Error logging and notification**
*For any* HuggingFace API error, the system should both log the error details and notify the user with actionable guidance.
**Validates: Requirements 6.6**

**Property 31: Circuit breaker behavior**
*For any* sequence of repeated API failures exceeding the threshold (3), the circuit breaker should open and prevent further API calls until the timeout period expires.
**Validates: Requirements 6.7**

### Categorization Properties

**Property 32: Category assignment**
*For any* analyzed report, the Categorization_Engine should assign exactly one category from the predefined list.
**Validates: Requirements 7.1**

**Property 33: Category filtering**
*For any* selected category, the Report_Scanner should display only reports that match that category.
**Validates: Requirements 7.5**

**Property 34: Default category fallback**
*For any* report where categorization confidence is low, the system should assign the "General" category.
**Validates: Requirements 7.6**

**Property 35: Categorization input completeness**
*For any* categorization request, both extracted text and marker information should be included in the HuggingFace API call.
**Validates: Requirements 7.7**

### Historical Timeline Properties

**Property 36: Chronological ordering**
*For any* set of reports, when displayed in the timeline, they should be sorted by upload date in chronological order.
**Validates: Requirements 8.1**

**Property 37: Trend calculation for all markers**
*For any* marker that appears in multiple reports, the Trend_Analyzer should calculate a trend (improving, declining, stable).
**Validates: Requirements 8.2, 8.3**

**Property 38: Time period filtering**
*For any* selected time period (3m, 6m, 1y, all), the Trend_Analyzer should include only reports within that period.
**Validates: Requirements 8.4**

**Property 39: Trend visualization threshold**
*For any* marker, if it appears in 3 or more reports, a trend line visualization should be displayed; otherwise, no trend line should appear.
**Validates: Requirements 8.5**

**Property 40: Concerning trend detection**
*For any* marker with a consistent decline or increase outside the normal range across multiple reports, it should be highlighted as concerning.
**Validates: Requirements 8.6**

**Property 41: Monthly grouping**
*For any* set of reports, when grouped by month, all reports from the same month and year should appear in the same group.
**Validates: Requirements 8.7**

### Accessibility Properties

**Property 42: ARIA label completeness**
*For any* interactive element in the Report_Scanner, it should have an appropriate aria-label attribute.
**Validates: Requirements 9.1**

**Property 43: Keyboard navigation support**
*For any* control in the Report_Scanner, it should be reachable and operable using only keyboard navigation (tab, enter, space).
**Validates: Requirements 9.2**

**Property 44: Keyboard shortcut functionality**
*For any* keyboard shortcut (Ctrl+U for upload, Ctrl+E for export, Ctrl+C for compare), pressing it should trigger the corresponding action.
**Validates: Requirements 9.3**

**Property 45: Screen reader announcements**
*For any* status change or loading state, the Report_Scanner should update aria-live regions to announce the change to screen readers.
**Validates: Requirements 9.4**

**Property 46: Focus management in modals**
*For any* modal dialog, when opened, focus should move to the modal; when closed, focus should return to the triggering element.
**Validates: Requirements 9.5**

**Property 47: Visualization text alternatives**
*For any* data visualization (chart, graph), a text alternative describing the data should be provided.
**Validates: Requirements 9.6**

**Property 48: High contrast mode support**
*For any* user with high contrast mode enabled, the Report_Scanner should apply high contrast styles.
**Validates: Requirements 9.7**

### Performance Properties

**Property 49: Lazy loading pagination**
*For any* initial report list load, exactly 10 reports should be fetched; for each subsequent scroll event, an additional batch of 10 reports should be fetched.
**Validates: Requirements 10.1, 10.2**

**Property 50: Client-side caching**
*For any* report that has been fetched, subsequent requests for the same report within the cache TTL should use cached data without making an API call.
**Validates: Requirements 10.3**

**Property 51: Chart virtualization threshold**
*For any* dataset with more than 50 data points, the chart rendering should use virtualization.
**Validates: Requirements 10.4**

**Property 52: Server-side cache TTL**
*For any* identical report analysis request, if made within 1 hour of a previous request, the cached result should be returned.
**Validates: Requirements 10.5**

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples demonstrating correct behavior
- Edge cases (empty PDFs, boundary file sizes, low-confidence scenarios)
- Error conditions (API failures, network errors, invalid inputs)
- Integration points between components
- UI rendering and interaction

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Invariants that must be maintained across operations
- Round-trip properties (e.g., store then retrieve should return same data)

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Framework Selection:**
- Frontend (TypeScript/JavaScript): fast-check
- Backend (Python): Hypothesis

**Test Configuration:**
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `# Feature: enhanced-report-scanner, Property {number}: {property_text}`

**Example Property Test Structure:**

```python
# Backend property test example
from hypothesis import given, strategies as st

@given(
    text=st.text(min_size=30, max_size=3000),
    user_id=st.uuids()
)
def test_property_11_report_persistence_completeness(text, user_id):
    """
    Feature: enhanced-report-scanner, Property 11: Report persistence completeness
    For any uploaded report and its analysis results, both the original file 
    content and all analysis components should be persisted to the database.
    """
    # Create report
    report = create_report(user_id, "test.pdf", text)
    
    # Retrieve from database
    stored_report = get_report(report.id)
    
    # Verify all components persisted
    assert stored_report is not None
    assert stored_report.file_content == text
    assert stored_report.markers is not None
    assert stored_report.deficiencies is not None
    assert stored_report.warnings is not None
    assert stored_report.suggestions is not None
```

```typescript
// Frontend property test example
import fc from 'fast-check';

describe('Property 49: Lazy loading pagination', () => {
  it('should load exactly 10 reports initially and 10 more per scroll', () => {
    // Feature: enhanced-report-scanner, Property 49: Lazy loading pagination
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.uuid(),
          filename: fc.string(),
          uploadDate: fc.date()
        }), { minLength: 30, maxLength: 100 }),
        (allReports) => {
          const { reports, loadMore } = useInfiniteReports('user-123');
          
          // Initial load
          expect(reports).toHaveLength(10);
          
          // First scroll
          loadMore();
          expect(reports).toHaveLength(20);
          
          // Second scroll
          loadMore();
          expect(reports).toHaveLength(30);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Coverage

Unit tests should cover:

1. **PDF Processing:**
   - Valid PDF with text extraction
   - PDF with no extractable text (edge case)
   - Non-PDF file rejection
   - File size boundary testing (9.9MB, 10MB, 10.1MB)
   - Minimum text length validation (29, 30, 31 characters)

2. **Comparison View:**
   - Comparing 2, 3, and 4 reports
   - Attempting to compare more than 4 reports (edge case)
   - Marker alignment with missing markers in some reports
   - Percentage change calculation with zero values (edge case)

3. **Data Persistence:**
   - Storing and retrieving reports
   - User isolation (user A cannot see user B's reports)
   - Cascade deletion verification
   - Encryption verification

4. **Export:**
   - PDF generation with all components
   - Email sending with retry logic
   - Export progress indication

5. **Error Handling:**
   - HuggingFace API timeout
   - Network connectivity loss
   - Invalid API responses
   - Circuit breaker state transitions

6. **Categorization:**
   - Each category type assignment
   - Default "General" category for low confidence
   - Category filtering

7. **Trends:**
   - Trend calculation with 2, 3, 5, 10 reports
   - Time period filtering edge cases
   - Concerning trend detection

8. **Accessibility:**
   - ARIA labels presence
   - Keyboard navigation flow
   - Focus management in modals
   - Screen reader announcements

9. **Performance:**
   - Cache hit/miss scenarios
   - Lazy loading with various dataset sizes
   - Virtualization threshold

### Integration Testing

Integration tests should verify:
- End-to-end flow: Upload → Extract → Analyze → Store → Retrieve
- Comparison flow: Select reports → Compare → Display trends
- Export flow: Select report → Generate PDF → Send email
- Error recovery: API failure → Retry → Graceful degradation

### Test Data Generation

For property-based tests, use generators for:
- PDF files with varying text content
- Marker data with different value ranges
- Report dates spanning multiple time periods
- User IDs for isolation testing
- File sizes around boundary conditions

For unit tests, use fixtures for:
- Sample blood test reports
- Sample radiology reports
- Reports with known marker values
- Reports with edge case scenarios
