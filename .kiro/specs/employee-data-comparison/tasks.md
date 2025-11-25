# Implementation Plan

- [x] 1. Set up project structure and Docker environment

  - Create directory structure: backend/ (FastAPI), frontend/ (React)
  - Create backend/requirements.txt with FastAPI, Pandas, SQLAlchemy, Psycopg2, Hypothesis, Pytest
  - Create backend/Dockerfile with Python 3.9 base image
  - Create frontend/Dockerfile with Node.js 16 base image
  - Create docker-compose.yml with backend, frontend, and PostgreSQL services
  - Configure environment variables for database connection (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB)
  - Set up volume persistence for PostgreSQL data
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Implement database models and connection

  - Create backend/app/database.py with SQLAlchemy engine and session configuration
  - Implement backend/app/models/pegawai.py with Pegawai model
  - Add all required fields: id, nip, nama, nik, npwp, tgl_lahir, kode_bank, nama_bank, nomor_rekening, status, month, year, created_at, updated_at
  - Add unique constraint on (nip, month, year)
  - Create indexes on nip, month, year, and status columns
  - Implement database initialization logic
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x]\* 2.1 Write property test for data persistence round-trip

  - **Property 3: Data persistence round-trip**
  - **Validates: Requirements 1.3, 5.1**

- [x]\* 2.2 Write property test for timestamp audit trail

  - **Property 17: Timestamp audit trail**
  - **Validates: Requirements 5.2**

- [x]\* 2.3 Write property test for month-year filtering

  - **Property 19: Month-year filtering**
  - **Validates: Requirements 5.4**

- [x] 3. Implement Excel parsing service

  - Create backend/app/services/excel_parser.py with ExcelParser class
  - Implement parse_file method using Pandas to read Excel files
  - Implement validate_columns method to check for required columns (NIP, Nama, NIK, NPWP, Tanggal Lahir, Kode Bank, Nama Bank, Nomor Rekening)
  - Add support for both .xlsx and .csv formats
  - Return parsed data as list of dictionaries
  - _Requirements: 1.1, 1.2_

- [ ]\* 3.1 Write property test for Excel parsing completeness

  - **Property 1: Excel parsing completeness**
  - **Validates: Requirements 1.1**

- [ ]\* 3.2 Write property test for invalid file rejection

  - **Property 2: Invalid file rejection**
  - **Validates: Requirements 1.2**

- [x] 4. Implement data validation service

  - Create backend/app/services/validation.py with validation functions
  - Implement validate_nip: check non-empty and alphanumeric
  - Implement validate_nomor_rekening: check non-empty and numeric
  - Implement validate_tanggal_lahir: check valid date format
  - Implement validate_kode_bank: check exactly 3 characters
  - Implement validate_employee_data: comprehensive validation returning list of errors
  - Implement check_duplicate_nip: detect duplicates within same month/year
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 1.4_

- [x]\* 4.1 Write property test for comprehensive field validation

  - **Property 24: Comprehensive field validation**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x]\* 4.2 Write property test for validation failure handling

  - **Property 25: Validation failure handling**
  - **Validates: Requirements 8.5**

- [x]\* 4.3 Write property test for duplicate NIP rejection

  - **Property 4: Duplicate NIP rejection**
  - **Validates: Requirements 1.4**

- [x] 5. Implement month selection logic

  - Create backend/app/services/month_utils.py
  - Implement get_previous_month function to calculate previous month from given month/year
  - Handle year boundary transitions (January → December of previous year)
  - Implement get_comparison_month_data to retrieve all employee records for comparison month
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 5.1 Write property test for previous month identification

  - **Property 6: Previous month identification**
  - **Validates: Requirements 2.1**

- [ ]\* 5.2 Write property test for complete month data retrieval

  - **Property 7: Complete month data retrieval**
  - **Validates: Requirements 2.2**

- [ ]\* 5.3 Write property test for most recent comparison month selection

  - **Property 8: Most recent comparison month selection**
  - **Validates: Requirements 2.4**

- [x] 6. Implement comparison service

  - Create backend/app/services/comparator.py with EmployeeComparator class
  - Implement identify_new_employees: find employees in current but not in previous (Status Masuk)
  - Implement identify_departed_employees: find employees in previous but not in current (Status Keluar)
  - Implement identify_account_changes: find employees with different nomor_rekening (Status Rekening Berbeda)
  - Implement compare_months method that orchestrates all comparisons
  - Handle edge case when no comparison data exists
  - Return ComparisonResult with categorized employees and summary statistics
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 2.3_

- [x] 6.1 Write property test for new employee identification

  - **Property 9: New employee identification**
  - **Validates: Requirements 3.1**

- [x] 6.2 Write property test for departed employee identification

  - **Property 10: Departed employee identification**
  - **Validates: Requirements 3.2**

- [x] 6.3 Write property test for account change detection

  - **Property 11: Account change detection**
  - **Validates: Requirements 3.3**

- [x] 6.4 Write property test for unchanged employee identification

  - **Property 12: Unchanged employee identification**
  - **Validates: Requirements 3.4**

- [x] 7. Implement upload API endpoint

  - Create backend/app/routers/upload.py with POST /upload endpoint
  - Accept multipart/form-data with file, month, and year parameters
  - Use ExcelParser to parse uploaded file
  - Use validation service to validate all employee data
  - Check for duplicate NIPs within the same month
  - Store validated data in database using Pegawai model
  - Return success response with record count
  - Handle validation errors with HTTP 400 and detailed error messages
  - _Requirements: 7.1, 7.2, 1.3, 1.4, 1.5_

- [ ]\* 7.1 Write property test for successful upload API response

  - **Property 20: Successful upload API response**
  - **Validates: Requirements 7.1**

- [ ]\* 7.2 Write property test for record count accuracy

  - **Property 5: Record count accuracy**
  - **Validates: Requirements 1.5**

- [x] 8. Implement comparison API endpoint

  - Create backend/app/routers/compare.py with POST /compare endpoint
  - Accept month and year parameters in request body
  - Query current month data from database
  - Use month_utils to get comparison month data
  - Use EmployeeComparator to generate comparison results
  - Update database records with status indicators (Masuk, Keluar, Rekening Berbeda)
  - Return comparison results in JSON format with summary statistics
  - Handle missing data with HTTP 400 and appropriate error message
  - _Requirements: 7.3, 7.4, 3.5_

- [ ]\* 8.1 Write property test for successful comparison API response

  - **Property 21: Successful comparison API response**
  - **Validates: Requirements 7.3**

- [ ]\* 8.2 Write property test for comparison result persistence

  - **Property 13: Comparison result persistence**
  - **Validates: Requirements 3.5**

- [ ]\* 8.3 Write property test for status field persistence

  - **Property 18: Status field persistence**
  - **Validates: Requirements 5.3**

- [x] 9. Implement API error handling and main application

  - Create backend/app/main.py with FastAPI app initialization
  - Add error handling middleware for validation errors (HTTP 400)
  - Add error handling for internal errors (HTTP 500) without exposing details
  - Add error handling for database connection failures (HTTP 503)
  - Configure CORS middleware for frontend communication
  - Register upload and compare routers
  - Add health check endpoint (GET /health)
  - Configure logging
  - _Requirements: 7.1, 7.3, 7.5, 5.5_

- [ ]\* 9.1 Write property test for API validation error handling

  - **Property 22: API validation error handling**
  - **Validates: Requirements 7.2, 7.4**

- [ ]\* 9.2 Write property test for internal error handling

  - **Property 23: Internal error handling**
  - **Validates: Requirements 7.5**

- [x] 10. Checkpoint - Ensure backend tests pass

  - Ensure all tests pass, ask the user if questions arise

- [x] 11. Initialize React frontend project

  - Create frontend/package.json with React, AG Grid, Axios dependencies
  - Initialize React application structure in frontend/src/
  - Create frontend/src/App.jsx as main component
  - Set up API base URL configuration (environment variable for backend URL)
  - Configure proxy for backend API calls during development
  - _Requirements: 4.1_

- [x] 12. Implement API service layer

  - Create frontend/src/api/api.js with Axios configuration
  - Set base URL to backend API (http://localhost:8000)
  - Implement uploadFile function for POST /upload with multipart/form-data
  - Implement getComparison function for POST /compare
  - Add error handling and response transformation
  - Add request timeout configuration (30 seconds)
  - _Requirements: 7.1, 7.3_

- [x] 13. Implement FileUpload component

  - Create frontend/src/components/FileUpload.jsx
  - Add file input with drag-and-drop support
  - Add month and year input fields
  - Add file type validation (only .xlsx and .csv)
  - Implement upload button that calls uploadFile API
  - Display upload progress indicator
  - Display success message with record count on successful upload
  - Display error messages from backend
  - Trigger comparison automatically after successful upload
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 14. Implement DataTable component

  - Create frontend/src/components/DataTable.jsx using AG Grid
  - Configure column definitions for all fields: NIP, Nama, NIK, NPWP, Tanggal Lahir, Kode Bank, Nama Bank, Nomor Rekening, Status
  - Implement status-based row styling with different colors for Masuk (green), Keluar (red), Rekening Berbeda (yellow)
  - Add custom cell renderer for Nomor Rekening column to show old and new values for Rekening Berbeda status
  - Enable sorting and filtering capabilities
  - Implement loading state display
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]\* 14.1 Write property test for complete data display

  - **Property 14: Complete data display**
  - **Validates: Requirements 4.2**

- [ ]\* 14.2 Write property test for status-based visual distinction

  - **Property 15: Status-based visual distinction**
  - **Validates: Requirements 4.3, 4.4**

- [ ]\* 14.3 Write property test for account number comparison display

  - **Property 16: Account number comparison display**
  - **Validates: Requirements 4.5**

- [x] 15. Implement main App component and error handling

  - Update frontend/src/App.jsx with main application layout
  - Integrate FileUpload component
  - Integrate DataTable component
  - Implement state management for comparison results
  - Add loading states during API calls
  - Implement network error handling with user-friendly messages
  - Add timeout error handling with retry option
  - Display validation errors from backend
  - Add error boundary component for unexpected errors
  - _Requirements: 4.1, 7.2, 7.4_

- [x] 16. Test Docker build and deployment

  - Build all Docker images (docker-compose build)
  - Start all containers (docker-compose up)
  - Verify backend is accessible at http://localhost:8000
  - Verify frontend is accessible at http://localhost:3000
  - Test database initialization and connection
  - Verify frontend can communicate with backend
  - Test volume persistence by restarting database container
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 17. Final checkpoint - End-to-end testing

  - Ensure all tests pass, ask the user if questions arise

- [x] 18. Implement Admin API endpoints for archive management

  - Create backend/app/routers/admin.py with admin endpoints
  - Implement GET /admin/months to return available months with record counts
  - Implement GET /admin/data/{month}/{year} to retrieve archive data with optional search parameter
  - Implement DELETE /admin/data to delete data for specific month/year
  - Add search filtering by NIP or Nama (case-insensitive)
  - Add proper error handling for invalid month/year values
  - _Requirements: 9.1, 9.2, 9.3_

- [x]\* 18.1 Write property test for available months retrieval

  - **Property 26: Available months retrieval**
  - **Validates: Requirements 9.1**

- [x]\* 18.2 Write property test for archive data retrieval

  - **Property 27: Archive data retrieval by month/year**
  - **Validates: Requirements 9.2**

- [x]\* 18.3 Write property test for archive search filtering

  - **Property 28: Archive search filtering**
  - **Validates: Requirements 9.3**

- [x] 19. Implement Archive Viewer frontend component

  - Create frontend/src/components/ArchiveViewer.jsx
  - Add month and year selection dropdowns
  - Implement search input field with live search capability
  - Add toggle button to show/hide archive viewer
  - Integrate with DataTable component for displaying results
  - Add loading states and error handling
  - Create frontend/src/components/ArchiveViewer.css for styling
  - _Requirements: 9.2, 9.3, 9.4_

- [x] 20. Update API service layer for archive features

  - Add getAvailableMonths function to frontend/src/api/api.js
  - Add getArchiveData function with search parameter support
  - Add deleteData function for admin operations
  - Update API exports
  - _Requirements: 9.1, 9.2_

- [x] 21. Integrate Archive Viewer into main application

  - Import ArchiveViewer component in App.jsx
  - Add ArchiveViewer component to main layout
  - Position between AdminPanel and FileUpload components
  - _Requirements: 9.4_

- [x] 22. Final checkpoint - Archive Viewer testing

  - Ensure all tests pass, ask the user if questions arise
