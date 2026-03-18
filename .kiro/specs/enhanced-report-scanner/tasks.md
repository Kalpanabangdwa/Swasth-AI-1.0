# Implementation Plan: Enhanced Report Scanner (Backend)

## Overview

This implementation plan focuses on the Python/FastAPI backend enhancements for the medical report scanner. The tasks build incrementally, starting with database setup and core services, then adding AI analysis improvements, error handling, and finally export functionality. Each task references specific requirements and includes optional property-based test sub-tasks.

## Tasks

- [x] 1. Set up database layer and models
  - Create SQLAlchemy models for User, Report, Marker, Deficiency, Warning, Suggestion tables
  - Implement database initialization and migration scripts
  - Add encryption utilities for sensitive health data
  - Set up database connection management with connection pooling
  - _Requirements: 3.1, 3.2, 3.5, 3.6_

- [ ]* 1.1 Write property test for database models
  - **Property 14: Referential integrity**
  - **Validates: Requirements 3.6**

- [x] 2. Implement ReportService for CRUD operations
  - [x] 2.1 Create ReportService class with database session management
    - Implement create_report method to store reports and analysis results
    - Implement get_reports method with pagination (limit/offset)
    - Implement get_report_by_id method with user authorization check
    - Implement delete_report method with cascade deletion
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_

  - [ ]* 2.2 Write property test for report persistence
    - **Property 11: Report persistence completeness**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 2.3 Write property test for user isolation
    - **Property 12: Report retrieval completeness**
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 2.4 Write property test for cascade deletion
    - **Property 15: Cascade deletion**
    - **Validates: Requirements 3.7**

  - [ ]* 2.5 Write unit tests for ReportService edge cases
    - Test retrieving non-existent report
    - Test deleting report from different user
    - Test pagination boundary conditions
    - _Requirements: 3.3, 3.4, 3.7_

- [x] 3. Enhance AnalysisService with improved AI analysis
  - [x] 3.1 Refactor existing analyze_report method
    - Extract marker extraction into separate method
    - Add reference range validation logic
    - Implement marker name normalization
    - Add date extraction from report text
    - Improve health score calculation algorithm
    - _Requirements: 5.2, 5.3, 5.5, 5.6, 5.7_

  - [ ]* 3.2 Write property test for reference range validation
    - **Property 21: Reference range validation**
    - **Validates: Requirements 5.2, 5.3**

  - [ ]* 3.3 Write property test for marker normalization
    - **Property 23: Marker name normalization**
    - **Validates: Requirements 5.6**

  - [ ]* 3.4 Write unit tests for marker extraction
    - Test various marker formats
    - Test edge cases (missing units, invalid values)
    - Test confidence scoring
    - _Requirements: 5.2, 5.5, 5.6_

- [x] 4. Implement robust error handling and retry mechanisms
  - [x] 4.1 Create CircuitBreaker class
    - Implement state management (closed, open, half_open)
    - Add failure counting and timeout logic
    - Integrate with HuggingFace API calls
    - _Requirements: 6.7_

  - [x] 4.2 Implement retry logic with exponential backoff
    - Create retry_with_backoff utility function
    - Apply to HuggingFace API calls in AnalysisService
    - Add graceful degradation for complete failures
    - _Requirements: 6.2, 6.3_

  - [x] 4.3 Add comprehensive error handling to AnalysisService
    - Create custom exception classes
    - Implement user-friendly error messages
    - Add error logging with context
    - _Requirements: 6.1, 6.6_

  - [ ]* 4.4 Write property test for retry with exponential backoff
    - **Property 26: API retry with exponential backoff**
    - **Validates: Requirements 6.2**

  - [ ]* 4.5 Write property test for circuit breaker
    - **Property 31: Circuit breaker behavior**
    - **Validates: Requirements 6.7**

  - [ ]* 4.6 Write unit tests for error scenarios
    - Test HuggingFace API timeout
    - Test network connectivity errors
    - Test invalid API responses
    - Test graceful degradation
    - _Requirements: 6.1, 6.2, 6.3, 6.6_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement CategoryService for automatic report categorization
  - [x] 6.1 Create CategoryService class
    - Define CATEGORIES constant list
    - Implement categorize_report method using HuggingFace API
    - Build categorization prompt with text and markers
    - Add confidence scoring and default to "General" for low confidence
    - _Requirements: 7.1, 7.2, 7.6, 7.7_

  - [ ]* 6.2 Write property test for category assignment
    - **Property 32: Category assignment**
    - **Validates: Requirements 7.1**

  - [ ]* 6.3 Write property test for default category fallback
    - **Property 34: Default category fallback**
    - **Validates: Requirements 7.6**

  - [ ]* 6.4 Write unit tests for categorization
    - Test each category type
    - Test low confidence scenarios
    - Test with various marker combinations
    - _Requirements: 7.1, 7.2, 7.6_

- [x] 7. Implement TrendService for historical analysis
  - [x] 7.1 Create TrendService class
    - Implement calculate_marker_trends method
    - Implement get_all_trends method
    - Add time period filtering (3m, 6m, 1y, all)
    - Implement trend direction calculation (improving, declining, stable)
    - Add concerning trend detection logic
    - _Requirements: 8.2, 8.3, 8.4, 8.6_

  - [ ]* 7.2 Write property test for trend calculation
    - **Property 37: Trend calculation for all markers**
    - **Validates: Requirements 8.2, 8.3**

  - [ ]* 7.3 Write property test for time period filtering
    - **Property 38: Time period filtering**
    - **Validates: Requirements 8.4**

  - [ ]* 7.4 Write property test for concerning trend detection
    - **Property 40: Concerning trend detection**
    - **Validates: Requirements 8.6**

  - [ ]* 7.5 Write unit tests for trend analysis
    - Test with 2, 3, 5, 10 reports
    - Test edge cases (single report, no common markers)
    - Test time period boundaries
    - _Requirements: 8.2, 8.3, 8.4, 8.6_

- [x] 8. Implement ExportService for PDF generation and email
  - [x] 8.1 Create ExportService class
    - Implement generate_pdf method using ReportLab
    - Format PDF content with sections for markers, deficiencies, warnings, suggestions
    - Add PDF styling and layout
    - _Requirements: 4.1, 4.2_

  - [x] 8.2 Implement email functionality
    - Set up SMTP configuration
    - Implement send_email method with retry logic
    - Create email template with summary
    - Add exponential backoff for email retries
    - _Requirements: 4.4, 4.5, 4.6_

  - [ ]* 8.3 Write property test for export completeness
    - **Property 17: Export completeness**
    - **Validates: Requirements 4.2**

  - [ ]* 8.4 Write property test for email retry
    - **Property 20: Email retry with exponential backoff**
    - **Validates: Requirements 4.6**

  - [ ]* 8.5 Write unit tests for export service
    - Test PDF generation with various report types
    - Test email sending success and failure
    - Test retry logic
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6_

- [x] 9. Create new API endpoints
  - [x] 9.1 Implement report management endpoints
    - POST /api/reports/upload - Upload and analyze report with categorization
    - GET /api/reports - List reports with pagination and category filtering
    - GET /api/reports/{report_id} - Get single report with authorization
    - DELETE /api/reports/{report_id} - Delete report with cascade
    - _Requirements: 3.3, 3.4, 3.7, 7.5_

  - [x] 9.2 Implement comparison and trends endpoints
    - POST /api/reports/compare - Compare multiple reports (2-4)
    - GET /api/reports/trends - Get trend analysis with time period filter
    - _Requirements: 2.1, 2.5, 2.6, 8.2, 8.4_

  - [x] 9.3 Implement export endpoints
    - POST /api/reports/{report_id}/export/pdf - Generate and return PDF
    - POST /api/reports/{report_id}/export/email - Send report via email
    - _Requirements: 4.1, 4.4_

  - [x] 9.4 Implement category endpoints
    - GET /api/categories - List available categories
    - GET /api/reports/category/{name} - Filter reports by category
    - _Requirements: 7.2, 7.5_

  - [ ]* 9.5 Write integration tests for API endpoints
    - Test end-to-end upload flow
    - Test comparison flow
    - Test export flow
    - Test error responses
    - _Requirements: 3.1, 3.2, 4.1, 7.1_

- [x] 10. Update existing /analyze-report endpoint
  - [x] 10.1 Refactor to use new services
    - Integrate ReportService for persistence
    - Integrate CategoryService for categorization
    - Update response format to include report ID and category
    - Add user_id parameter for multi-user support
    - _Requirements: 3.1, 3.2, 7.1_

  - [ ]* 10.2 Write property test for file validation
    - **Property 2: Invalid file type rejection**
    - **Property 3: File size validation**
    - **Validates: Requirements 1.2, 1.4**

  - [ ]* 10.3 Write unit tests for updated endpoint
    - Test with valid PDF
    - Test with invalid file type
    - Test with oversized file
    - Test with empty PDF
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 11. Add caching layer
  - [x] 11.1 Implement server-side caching
    - Set up TTLCache for analysis results
    - Create cache key generation from text hash
    - Integrate caching in AnalysisService
    - Add cache invalidation logic
    - _Requirements: 10.5_

  - [ ]* 11.2 Write property test for cache TTL
    - **Property 52: Server-side cache TTL**
    - **Validates: Requirements 10.5**

  - [ ]* 11.3 Write unit tests for caching
    - Test cache hit scenarios
    - Test cache miss scenarios
    - Test cache expiration
    - _Requirements: 10.5_

- [x] 12. Add comprehensive logging and monitoring
  - Add structured logging throughout services
  - Log API calls to HuggingFace with timing
  - Log database operations
  - Add error tracking with context
  - _Requirements: 6.6_

- [x] 13. Update environment configuration
  - Add database connection string to .env
  - Add SMTP configuration variables
  - Add cache configuration
  - Update README with new environment variables
  - _Requirements: 3.1, 4.4_

- [x] 14. Final checkpoint - Integration testing
  - Run all unit tests and property tests
  - Test complete end-to-end flows
  - Verify error handling and retry mechanisms
  - Test with sample medical reports
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The implementation builds incrementally: database → services → error handling → API endpoints
- All AI analysis continues to use HuggingFace Mistral-7B API
- Database can be SQLite for development, PostgreSQL for production
