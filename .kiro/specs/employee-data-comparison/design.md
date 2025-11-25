# Design Document

## Overview

The Employee Data Comparison Application is a full-stack web application that enables users to upload monthly employee data in Excel format, automatically compare it with the previous month's data, and visualize changes in employee status. The system uses a React frontend for user interaction, FastAPI backend for business logic, and PostgreSQL for persistent data storage, all containerized using Docker for consistent deployment.

## Architecture

The application follows a three-tier architecture:

```
┌────────────────────────┐        ┌──────────────────────────┐
│      React (Frontend)  │ <----> │     FastAPI (Backend)    │
│ - Upload file Excel    │  HTTP  │ - Proses Excel dg Pandas │
│ - Tabel hasil comparison│  REST  │ - Bandingkan 2 dataset   │
└────────────────────────┘        └──────────────────────────┘
                                          │
                                          ▼
                                  PostgreSQL Database
                                      └───────┘
                                    Data pegawai
```

**Frontend Layer (React + AG Grid)**

- Handles user interactions for file upload
- Displays comparison results in an interactive table
- Communicates with backend via REST API

**Backend Layer (FastAPI + Pandas)**

- Processes Excel files using Pandas
- Implements business logic for data comparison
- Manages database operations through SQLAlchemy ORM
- Exposes REST API endpoints

**Data Layer (PostgreSQL)**

- Stores historical employee data
- Maintains data integrity through constraints and indexes
- Supports efficient querying for comparison operations

## Components and Interfaces

### Backend Components

#### 1. Excel Parser Service (`excel_parser.py`)

**Responsibility**: Parse and validate Excel files

**Interface**:

```python
class ExcelParser:
    def parse_file(file: UploadFile) -> pd.DataFrame
    def validate_columns(df: pd.DataFrame) -> bool
    def validate_data_types(df: pd.DataFrame) -> List[ValidationError]
```

**Required Columns**: NIP, Nama, NIK, NPWP, Tanggal Lahir, Kode Bank, Nama Bank, Nomor Rekening

#### 2. Data Validation Service (`validation.py`)

**Responsibility**: Validate employee data fields

**Interface**:

```python
def validate_nip(nip: str) -> bool
def validate_nomor_rekening(rekening: str) -> bool
def validate_tanggal_lahir(tanggal: str) -> bool
def validate_kode_bank(kode: str) -> bool
def validate_employee_data(employee: dict) -> List[ValidationError]
```

#### 3. Comparison Service (`comparator.py`)

**Responsibility**: Compare employee data between two months

**Interface**:

```python
class EmployeeComparator:
    def identify_new_employees(current: List[Employee], previous: List[Employee]) -> List[Employee]
    def identify_departed_employees(current: List[Employee], previous: List[Employee]) -> List[Employee]
    def identify_account_changes(current: List[Employee], previous: List[Employee]) -> List[Employee]
    def compare_months(current_month: int, current_year: int) -> ComparisonResult
```

#### 4. Month Selection Logic (`month_utils.py`)

**Responsibility**: Calculate and retrieve comparison month data

**Interface**:

```python
def get_previous_month(month: int, year: int) -> Tuple[int, int]
def get_comparison_month_data(month: int, year: int) -> List[Employee]
```

#### 5. API Routers

**Upload Router** (`routers/upload.py`):

```python
POST /upload
- Request: multipart/form-data (file, month, year)
- Response: {"status": "success", "records_processed": int}
```

**Compare Router** (`routers/compare.py`):

```python
POST /compare
- Request: {"month": int, "year": int}
- Response: {"results": List[Employee], "summary": ComparisonSummary}
```

**Admin Router** (`routers/admin.py`):

```python
GET /admin/months
- Response: {"status": "success", "months": List[MonthInfo]}

GET /admin/data/{month}/{year}?search={search_term}
- Response: {"status": "success", "month": int, "year": int, "count": int, "data": List[Employee]}

DELETE /admin/data
- Request: {"month": int, "year": int}
- Response: {"status": "success", "message": str, "deleted_count": int}
```

### Frontend Components

#### 1. FileUpload Component (`FileUpload.jsx`)

**Responsibility**: Handle file selection and upload

**Props**:

```javascript
{
  onUploadSuccess: (recordCount) => void,
  onUploadError: (error) => void
}
```

#### 2. DataTable Component (`DataTable.jsx`)

**Responsibility**: Display comparison results using AG Grid

**Props**:

```javascript
{
  data: Array<Employee>,
  loading: boolean
}
```

**Column Definitions**:

- NIP, Nama, NIK, NPWP, Tanggal Lahir
- Kode Bank, Nama Bank, Nomor Rekening
- Status (with color coding)

#### 3. API Service Layer (`api.js`)

**Responsibility**: Handle HTTP communication with backend

**Interface**:

```javascript
async function uploadFile(file, month, year)
async function getComparison(month, year)
async function getAvailableMonths()
async function getArchiveData(month, year, search)
async function deleteData(month, year)
```

#### 4. ArchiveViewer Component (`ArchiveViewer.jsx`)

**Responsibility**: Display and search historical employee data

**Features**:

- Month/year selection dropdown
- Live search by NIP or Nama
- Display archive data in DataTable
- Toggle visibility of archive viewer

**Props**: None (self-contained component)

## Data Models

### Employee Model (SQLAlchemy)

```python
class Pegawai(Base):
    __tablename__ = "pegawai"

    id: int (Primary Key, Auto-increment)
    nip: str (VARCHAR 20, Indexed)
    nama: str (VARCHAR 255)
    nik: str (VARCHAR 20)
    npwp: str (VARCHAR 20)
    tgl_lahir: date
    kode_bank: str (VARCHAR 3)
    nama_bank: str (VARCHAR 50)
    nomor_rekening: str (VARCHAR 20)
    status: str (ENUM: 'Aktif', 'Masuk', 'Keluar', 'Rekening Berbeda')
    month: int (Indexed)
    year: int (Indexed)
    created_at: datetime (Auto-generated)
    updated_at: datetime (Auto-updated)

    __table_args__ = (
        UniqueConstraint('nip', 'month', 'year'),
        Index('idx_nip', 'nip'),
        Index('idx_month_year', 'month', 'year'),
        Index('idx_status', 'status')
    )
```

### Comparison Result Model

```python
class ComparisonResult:
    new_employees: List[Employee]  # Status Masuk
    departed_employees: List[Employee]  # Status Keluar
    account_changes: List[Employee]  # Status Rekening Berbeda
    unchanged_employees: List[Employee]
    summary: ComparisonSummary

class ComparisonSummary:
    total_current: int
    total_previous: int
    new_count: int
    departed_count: int
    account_change_count: int
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Excel parsing completeness

_For any_ valid Excel file with required columns, parsing should extract all rows and preserve all field values without data loss
**Validates: Requirements 1.1**

### Property 2: Invalid file rejection

_For any_ Excel file missing required columns or with invalid format, the system should reject the file and return a validation error
**Validates: Requirements 1.2**

### Property 3: Data persistence round-trip

_For any_ employee record stored in the database, retrieving it by NIP, month, and year should return the same data values
**Validates: Requirements 1.3, 5.1**

### Property 4: Duplicate NIP rejection

_For any_ upload attempt with duplicate NIP entries within the same month and year, the system should reject the upload
**Validates: Requirements 1.4**

### Property 5: Record count accuracy

_For any_ successful upload, the returned record count should equal the number of valid employee records stored in the database
**Validates: Requirements 1.5**

### Property 6: Previous month identification

_For any_ given month and year, the system should correctly identify the previous month, handling year boundaries (January → December of previous year)
**Validates: Requirements 2.1**

### Property 7: Complete month data retrieval

_For any_ month and year with stored data, retrieving comparison month data should return all employee records for that period
**Validates: Requirements 2.2**

### Property 8: Most recent comparison month selection

_For any_ current month, when multiple historical months exist, the system should select the most recent previous month as the comparison month
**Validates: Requirements 2.4**

### Property 9: New employee identification

_For any_ employee present in current month data but not in comparison month data, the system should assign Status Masuk
**Validates: Requirements 3.1**

### Property 10: Departed employee identification

_For any_ employee present in comparison month data but not in current month data, the system should assign Status Keluar
**Validates: Requirements 3.2**

### Property 11: Account change detection

_For any_ employee present in both months with different nomor_rekening values, the system should assign Status Rekening Berbeda
**Validates: Requirements 3.3**

### Property 12: Unchanged employee identification

_For any_ employee present in both months with identical data, the system should maintain their status without modification
**Validates: Requirements 3.4**

### Property 13: Comparison result persistence

_For any_ completed comparison, all results with status indicators should be persisted to the database
**Validates: Requirements 3.5**

### Property 14: Complete data display

_For any_ comparison result, the displayed table should include all employee fields without omission
**Validates: Requirements 4.2**

### Property 15: Status-based visual distinction

_For any_ employee with Status Masuk, Status Keluar, or Status Rekening Berbeda, the table row should have distinct visual styling
**Validates: Requirements 4.3, 4.4**

### Property 16: Account number comparison display

_For any_ employee with Status Rekening Berbeda, the display should show both old and new account numbers
**Validates: Requirements 4.5**

### Property 17: Timestamp audit trail

_For any_ employee record, created_at and updated_at timestamps should be automatically recorded and maintained
**Validates: Requirements 5.2**

### Property 18: Status field persistence

_For any_ employee record with an assigned status, the status value should be persisted and retrievable from the database
**Validates: Requirements 5.3**

### Property 19: Month-year filtering

_For any_ query filtering by month and year, the system should return only records matching those exact values
**Validates: Requirements 5.4**

### Property 20: Successful upload API response

_For any_ successful file upload, the API should return HTTP 200 with a success message and record count
**Validates: Requirements 7.1**

### Property 21: Successful comparison API response

_For any_ successful comparison request, the API should return HTTP 200 with comparison results in JSON format
**Validates: Requirements 7.3**

### Property 22: API validation error handling

_For any_ request with invalid data, the API should return HTTP 400 with detailed validation error messages
**Validates: Requirements 7.2, 7.4**

### Property 23: Internal error handling

_For any_ internal server error, the API should return HTTP 500 without exposing internal implementation details
**Validates: Requirements 7.5**

### Property 24: Comprehensive field validation

_For any_ employee data, validation should check NIP (non-empty, alphanumeric), nomor_rekening (non-empty, numeric), tgl_lahir (valid date), and kode_bank (exactly 3 characters)
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 25: Validation failure handling

_For any_ employee data with multiple validation failures, the system should return comprehensive error messages indicating all failures
**Validates: Requirements 8.5**

### Property 26: Available months retrieval

_For any_ database state with stored employee data, the system should return all distinct month/year combinations with accurate record counts
**Validates: Requirements 9.1**

### Property 27: Archive data retrieval by month/year

_For any_ valid month and year with stored data, the system should retrieve all employee records for that specific period
**Validates: Requirements 9.2**

### Property 28: Archive search filtering

_For any_ search term and archive data, the system should return only records where NIP or Nama contains the search term (case-insensitive)
**Validates: Requirements 9.3**

## Error Handling

### Backend Error Handling

**Validation Errors (HTTP 400)**:

- Missing required columns in Excel file
- Invalid data types or formats
- Duplicate NIP entries
- Missing month/year parameters

**Not Found Errors (HTTP 404)**:

- No comparison month data available
- Requested month/year data not found

**Internal Server Errors (HTTP 500)**:

- Database connection failures
- Unexpected parsing errors
- File processing errors

**Error Response Format**:

```json
{
  "error": "Error type",
  "message": "User-friendly error message",
  "details": ["Specific validation error 1", "Specific validation error 2"]
}
```

### Frontend Error Handling

- Network errors: Display user-friendly message with retry option
- Validation errors: Display specific field errors from backend
- Timeout errors: Show timeout message and retry option
- Unexpected errors: Use error boundary to catch and display gracefully

## Testing Strategy

### Unit Testing

The application will use **pytest** for backend unit tests and **Jest** with **React Testing Library** for frontend unit tests.

**Backend Unit Tests**:

- Excel parser: Test parsing of valid files, handling of invalid formats
- Validation functions: Test each validation rule with valid and invalid inputs
- Month calculation: Test previous month calculation including year boundaries
- API endpoints: Test request/response handling and error cases

**Frontend Unit Tests**:

- FileUpload component: Test file selection, upload triggering, error display
- DataTable component: Test data rendering, status styling
- API service: Test HTTP request formation and response handling

### Property-Based Testing

The application will use **Hypothesis** for Python property-based testing.

**Configuration**:

- Each property-based test will run a minimum of 100 iterations
- Each test will be tagged with a comment referencing the correctness property from this design document
- Tag format: `# Feature: employee-data-comparison, Property {number}: {property_text}`

**Property Test Coverage**:

- Data persistence and retrieval (Properties 3, 5, 7, 13, 17, 18, 19)
- Comparison logic (Properties 9, 10, 11, 12)
- Validation logic (Properties 2, 4, 24, 25)
- API behavior (Properties 20, 21, 22, 23)
- Month calculation (Property 6)

**Test Generators**:

- Employee data generator: Creates random valid employee records
- Invalid data generator: Creates data with specific validation failures
- Month/year generator: Creates valid and edge-case month/year combinations
- Excel file generator: Creates valid and invalid Excel file structures

### Integration Testing

- End-to-end file upload and comparison workflow
- Database operations with actual PostgreSQL instance
- API endpoint integration with database layer
- Frontend-backend communication

### Docker Environment Testing

- Verify all containers start successfully
- Test inter-container communication
- Verify database persistence through container restarts
- Test environment variable configuration

## Technology Stack

**Backend**:

- FastAPI 0.104+
- Pandas 2.0+
- SQLAlchemy 2.0+
- Psycopg2 (PostgreSQL driver)
- Python 3.9+
- Hypothesis (property-based testing)
- Pytest (unit testing)

**Frontend**:

- React 18+
- AG Grid React 30+
- Axios (HTTP client)
- Jest + React Testing Library (testing)

**Database**:

- PostgreSQL 13+

**DevOps**:

- Docker Desktop
- Docker Compose 3.8+

## Deployment Architecture

All services run in Docker containers orchestrated by Docker Compose:

**Backend Container**:

- Base image: python:3.9-slim
- Exposed port: 8000
- Volume mount: ./backend:/app (for development)

**Frontend Container**:

- Base image: node:16
- Exposed port: 3000
- Volume mount: ./frontend:/app (for development)

**Database Container**:

- Base image: postgres:13
- Exposed port: 5432
- Volume: pgdata (persistent storage)
- Environment: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB

**Network**:

- All containers on same Docker network for inter-service communication
- Frontend → Backend: HTTP REST API
- Backend → Database: PostgreSQL protocol
