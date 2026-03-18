# Enhanced Report Scanner - Setup Guide

## Quick Start

### Backend Setup

1. **Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Configure environment variables:**
Edit `backend/.env` and add your HuggingFace token:
```bash
HUGGINGFACE_TOKEN=your_token_here
```

3. **Initialize the database:**
```bash
python init_db.py
```

4. **Start the backend server:**
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Install Node dependencies:**
```bash
cd frontend
npm install
```

2. **Configure environment variables:**
Edit `frontend/.env` and add:
```bash
VITE_HUGGINGFACE_TOKEN=your_token_here
```

3. **Start the development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## New Features

### 1. Data Persistence
- All uploaded reports are now saved to the database
- Reports persist across sessions
- User-specific report storage

### 2. Report Comparison
- Compare 2-4 reports side-by-side
- Track marker changes over time
- Percentage change calculations
- Trend visualization

### 3. Export Functionality
- Export reports as PDF
- Send reports via email
- Professional PDF formatting
- Email with summary

### 4. Automatic Categorization
- AI-powered report categorization
- Categories: Blood Test, Radiology, Pathology, Cardiology, Endocrinology, General
- Filter reports by category

### 5. Historical Tracking
- View all reports in chronological order
- Trend analysis for health markers
- Identify concerning trends
- Time period filtering (3m, 6m, 1y, all)

### 6. Enhanced AI Analysis
- Improved marker extraction accuracy
- Reference range validation
- Marker name normalization
- Date extraction from reports

### 7. Robust Error Handling
- Circuit breaker pattern for API calls
- Exponential backoff retry logic
- Graceful degradation
- User-friendly error messages

### 8. Performance Optimizations
- Server-side caching (1-hour TTL)
- Lazy loading for reports
- Optimized database queries
- Reduced API calls

## API Endpoints

### New Endpoints

```
POST   /api/reports/upload          - Upload and analyze report
GET    /api/reports                 - List reports with pagination
GET    /api/reports/{id}            - Get single report
DELETE /api/reports/{id}            - Delete report
POST   /api/reports/compare         - Compare multiple reports
GET    /api/reports/trends          - Get trend analysis
POST   /api/reports/{id}/export/pdf - Export as PDF
POST   /api/reports/{id}/export/email - Send via email
GET    /api/categories              - List categories
GET    /api/reports/category/{name} - Filter by category
```

### Legacy Endpoint (Still Supported)

```
POST   /analyze-report              - Original analysis endpoint
```

## Database Schema

The system uses SQLite by default with the following tables:

- **users** - User accounts
- **reports** - Medical reports
- **markers** - Health markers
- **deficiencies** - Identified deficiencies
- **warnings** - Health warnings
- **suggestions** - Dietary suggestions

All tables have proper foreign key relationships and cascade deletion.

## Configuration Options

### Database

Switch to PostgreSQL for production:
```bash
DATABASE_URL=postgresql://user:password@localhost/swasth_reports
```

### Email (SMTP)

Configure email export:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=noreply@swasthai.com
```

### Encryption

Generate and set encryption key:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Add to `.env`:
```bash
ENCRYPTION_KEY=your_generated_key
```

### Caching

Adjust cache settings:
```bash
CACHE_MAXSIZE=100
CACHE_TTL=3600
```

## Testing the Implementation

### 1. Test Report Upload
```bash
curl -X POST http://localhost:8000/api/reports/upload \
  -F "file=@sample_report.pdf" \
  -F "user_email=test@example.com"
```

### 2. Test Report Listing
```bash
curl "http://localhost:8000/api/reports?user_email=test@example.com"
```

### 3. Test Report Comparison
```bash
curl -X POST "http://localhost:8000/api/reports/compare?user_email=test@example.com" \
  -H "Content-Type: application/json" \
  -d '{"report_ids": ["id1", "id2"]}'
```

### 4. Test Trend Analysis
```bash
curl "http://localhost:8000/api/reports/trends?user_email=test@example.com&time_period=6m"
```

### 5. Test PDF Export
```bash
curl -X POST "http://localhost:8000/api/reports/{report_id}/export/pdf?user_email=test@example.com" \
  --output report.pdf
```

## Troubleshooting

### Database Issues
- Run `python init_db.py` to create tables
- Check file permissions for SQLite database
- Verify DATABASE_URL configuration

### HuggingFace API Errors
- Verify HUGGINGFACE_TOKEN is set correctly
- Check token validity at https://huggingface.co/settings/tokens
- Monitor API rate limits

### Email Sending Fails
- Use App Password for Gmail (not regular password)
- Enable 2-factor authentication
- Check SMTP credentials

### Circuit Breaker Open
- Wait 60 seconds for circuit to reset
- Check HuggingFace API status
- Verify network connectivity

## Next Steps

1. **Frontend Integration**: Update the React frontend to use the new API endpoints
2. **User Authentication**: Add proper user authentication and authorization
3. **Production Deployment**: Deploy to a production server with PostgreSQL
4. **Monitoring**: Set up logging and monitoring for production
5. **Testing**: Add comprehensive unit and integration tests

## Support

For issues or questions:
- Check the backend/README.md for detailed documentation
- Review the API documentation at http://localhost:8000/docs
- Check the logs for error messages

## License

MIT License
