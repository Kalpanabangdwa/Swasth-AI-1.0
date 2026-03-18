# Swasth AI Backend - Enhanced Report Scanner

## Overview

Enhanced medical report scanner backend with AI-powered analysis, data persistence, report comparison, export functionality, and comprehensive error handling.

## Features

- **PDF Report Analysis**: Extract text from PDFs and analyze with HuggingFace Mistral-7B
- **Data Persistence**: Store reports and analysis in SQLite/PostgreSQL database
- **Report Comparison**: Compare multiple reports side-by-side with trend analysis
- **Export Functionality**: Generate PDF exports and send via email
- **Automatic Categorization**: AI-powered report categorization
- **Historical Tracking**: Track health markers over time with trend analysis
- **Robust Error Handling**: Circuit breaker pattern and exponential backoff retry
- **Caching**: Server-side caching for improved performance
- **Data Encryption**: Encrypt sensitive health data at rest

## Installation

### Prerequisites

- Python 3.9+
- pip

### Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables in `.env`:
```bash
# Required
HUGGINGFACE_TOKEN=your_token_here

# Optional - Database (defaults to SQLite)
DATABASE_URL=sqlite:///./swasth_reports.db

# Optional - Encryption (auto-generated if not set)
ENCRYPTION_KEY=your_encryption_key

# Optional - SMTP for email export
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=noreply@swasthai.com
```

3. Initialize database:
```bash
python init_db.py
```

4. Run the server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Report Management

#### Upload Report
```http
POST /api/reports/upload
Content-Type: multipart/form-data

file: PDF file
user_email: user@example.com
hf_token: (optional) HuggingFace token
```

#### List Reports
```http
GET /api/reports?user_email=user@example.com&category=Blood%20Test&limit=10&offset=0
```

#### Get Single Report
```http
GET /api/reports/{report_id}?user_email=user@example.com
```

#### Delete Report
```http
DELETE /api/reports/{report_id}?user_email=user@example.com
```

### Comparison and Trends

#### Compare Reports
```http
POST /api/reports/compare?user_email=user@example.com
Content-Type: application/json

{
  "report_ids": ["id1", "id2", "id3"]
}
```

#### Get Trends
```http
GET /api/reports/trends?user_email=user@example.com&time_period=6m
```

Time periods: `3m`, `6m`, `1y`, `all`

### Export

#### Export as PDF
```http
POST /api/reports/{report_id}/export/pdf?user_email=user@example.com
```

#### Send via Email
```http
POST /api/reports/{report_id}/export/email?user_email=user@example.com
Content-Type: application/json

{
  "recipient": "doctor@example.com"
}
```

### Categories

#### List Categories
```http
GET /api/categories
```

#### Filter by Category
```http
GET /api/reports/category/Blood%20Test?user_email=user@example.com
```

### Legacy Endpoint

#### Analyze Report (Legacy)
```http
POST /analyze-report
Content-Type: multipart/form-data

file: PDF file
hf_token: (optional) HuggingFace token
user_email: (optional) user@example.com
```

## Architecture

### Services

- **ReportService**: CRUD operations for reports
- **AnalysisService**: AI-powered report analysis with HuggingFace
- **CategoryService**: Automatic report categorization
- **TrendService**: Historical trend analysis
- **ExportService**: PDF generation and email delivery
- **CacheService**: Server-side caching for analysis results

### Database Models

- **User**: User accounts
- **Report**: Medical reports with metadata
- **Marker**: Health markers extracted from reports
- **Deficiency**: Identified deficiencies
- **Warning**: Health warnings
- **Suggestion**: Dietary and health suggestions

### Error Handling

- **Circuit Breaker**: Prevents cascading failures for external API calls
- **Exponential Backoff**: Automatic retry with increasing delays
- **Graceful Degradation**: Returns partial results when AI analysis fails

## Configuration

### Database

Default: SQLite (`sqlite:///./swasth_reports.db`)

For PostgreSQL:
```bash
DATABASE_URL=postgresql://user:password@localhost/swasth_reports
```

### Encryption

Generate a new encryption key:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Add to `.env`:
```bash
ENCRYPTION_KEY=your_generated_key
```

### SMTP for Email

For Gmail, use an App Password:
1. Enable 2-factor authentication
2. Generate App Password at https://myaccount.google.com/apppasswords
3. Add to `.env`:
```bash
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

## Development

### Running Tests

```bash
pytest
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

### Code Structure

```
backend/
├── main.py                 # FastAPI application
├── database.py             # Database configuration
├── models.py               # SQLAlchemy models
├── encryption.py           # Encryption utilities
├── init_db.py             # Database initialization
├── services/
│   ├── report_service.py   # Report CRUD
│   ├── analysis_service.py # AI analysis
│   ├── category_service.py # Categorization
│   ├── trend_service.py    # Trend analysis
│   ├── export_service.py   # PDF/Email export
│   ├── cache_service.py    # Caching
│   └── error_handling.py   # Error handling utilities
└── requirements.txt        # Dependencies
```

## Troubleshooting

### HuggingFace API Errors

- Ensure `HUGGINGFACE_TOKEN` is set in `.env`
- Check token validity at https://huggingface.co/settings/tokens
- Verify API rate limits

### Database Errors

- Run `python init_db.py` to create tables
- Check `DATABASE_URL` configuration
- Ensure write permissions for SQLite file

### Email Sending Fails

- Verify SMTP credentials
- Check firewall/network settings
- Use App Password for Gmail (not regular password)

### Circuit Breaker Open

- Wait for timeout period (default 60 seconds)
- Check HuggingFace API status
- Verify network connectivity

## License

MIT License
