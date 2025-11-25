# Requirements Document

## Introduction

Aplikasi Perbandingan Data Pegawai adalah sistem berbasis web yang memungkinkan pengguna untuk mengupload data pegawai bulanan dalam format Excel, membandingkannya dengan data bulan sebelumnya, dan mengidentifikasi perubahan status pegawai (pegawai baru, pegawai keluar, atau perubahan nomor rekening). Sistem ini menggunakan PostgreSQL untuk menyimpan riwayat data pegawai dan mendukung pelacakan perubahan dari waktu ke waktu.

## Glossary

- **System**: Aplikasi Perbandingan Data Pegawai
- **User**: Pengguna yang mengupload dan melihat data perbandingan pegawai
- **NIP**: Nomor Induk Pegawai, identifier unik untuk setiap pegawai
- **Current Month Data**: Data pegawai untuk bulan yang sedang diupload
- **Comparison Month Data**: Data pegawai dari bulan sebelumnya yang digunakan untuk perbandingan
- **Status Masuk**: Status yang menunjukkan pegawai baru yang muncul di bulan ini
- **Status Keluar**: Status yang menunjukkan pegawai yang tidak ada lagi di bulan ini
- **Status Rekening Berbeda**: Status yang menunjukkan pegawai dengan perubahan nomor rekening
- **Excel File**: File dalam format .xlsx atau .csv yang berisi data pegawai
- **Database**: PostgreSQL database yang menyimpan semua data pegawai historis

## Requirements

### Requirement 1

**User Story:** Sebagai user, saya ingin mengupload file Excel yang berisi data pegawai, sehingga sistem dapat memproses dan menyimpan data tersebut untuk perbandingan.

#### Acceptance Criteria

1. WHEN a user uploads an Excel file THEN the System SHALL parse the file and extract employee data
2. WHEN the uploaded file has invalid format or missing required columns THEN the System SHALL reject the file and return a validation error message
3. WHEN employee data is successfully parsed THEN the System SHALL store the data in the Database with month and year metadata
4. WHEN duplicate NIP entries exist within the same month THEN the System SHALL reject the upload and return an error message
5. WHEN data is successfully stored THEN the System SHALL return a success response with the count of records processed

### Requirement 2

**User Story:** Sebagai user, saya ingin sistem secara otomatis memilih bulan pembanding yang tepat, sehingga perbandingan data dilakukan dengan data bulan sebelumnya.

#### Acceptance Criteria

1. WHEN a user uploads data for a specific month THEN the System SHALL identify the previous month as the comparison month
2. WHEN the comparison month data exists in the Database THEN the System SHALL retrieve all employee records for that month
3. WHEN the current month is January THEN the System SHALL identify December of the previous year as the comparison month
4. WHEN no comparison month data exists THEN the System SHALL handle this gracefully and indicate that no comparison is available

### Requirement 3

**User Story:** Sebagai user, saya ingin melihat hasil perbandingan data pegawai, sehingga saya dapat mengidentifikasi pegawai baru, pegawai keluar, dan perubahan rekening.

#### Acceptance Criteria

1. WHEN comparing two months of data THEN the System SHALL identify employees present in current month but not in comparison month and assign Status Masuk
2. WHEN comparing two months of data THEN the System SHALL identify employees present in comparison month but not in current month and assign Status Keluar
3. WHEN an employee exists in both months with different account numbers THEN the System SHALL assign Status Rekening Berbeda
4. WHEN an employee exists in both months with identical data THEN the System SHALL maintain their existing status without changes
5. WHEN comparison is complete THEN the System SHALL persist all comparison results with status indicators in the Database

### Requirement 4

**User Story:** Sebagai user, saya ingin melihat hasil perbandingan dalam tabel yang interaktif, sehingga saya dapat dengan mudah menganalisis perubahan data pegawai.

#### Acceptance Criteria

1. WHEN the comparison results are available THEN the System SHALL display all employee data in a table format
2. WHEN displaying comparison results THEN the System SHALL show all employee fields including NIP, nama, NIK, NPWP, tanggal lahir, kode bank, nama bank, and nomor rekening
3. WHEN displaying employees with Status Masuk THEN the System SHALL apply distinct visual styling to those rows
4. WHEN displaying employees with Status Keluar or Status Rekening Berbeda THEN the System SHALL apply distinct visual styling to differentiate them
5. WHEN displaying employees with Status Rekening Berbeda THEN the System SHALL show both old and new account numbers for comparison

### Requirement 5

**User Story:** Sebagai system administrator, saya ingin data pegawai disimpan dengan aman dan terstruktur di database, sehingga riwayat data dapat diakses untuk analisis masa depan.

#### Acceptance Criteria

1. WHEN employee data is stored THEN the System SHALL persist all required fields including NIP, nama, NIK, NPWP, tgl_lahir, kode_bank, nama_bank, nomor_rekening, status, month, and year
2. WHEN storing employee records THEN the System SHALL automatically record created_at and updated_at timestamps
3. WHEN querying employee data THEN the System SHALL enforce that the combination of NIP, month, and year is unique
4. WHEN filtering employee data THEN the System SHALL support efficient queries by month, year, NIP, and status through database indexes
5. WHEN database connection fails THEN the System SHALL handle the error gracefully and return an appropriate error response

### Requirement 6

**User Story:** Sebagai developer, saya ingin aplikasi berjalan dalam environment Docker yang konsisten, sehingga deployment dan development dapat dilakukan dengan mudah.

#### Acceptance Criteria

1. WHEN the application is started THEN the System SHALL run the backend, frontend, and database services in separate Docker containers
2. WHEN Docker containers are started THEN the System SHALL establish proper network communication between frontend, backend, and database services
3. WHEN the database container is restarted THEN the System SHALL persist all data through Docker volumes
4. WHEN environment variables are configured THEN the System SHALL use them for database connection and service configuration
5. WHEN all containers are running THEN the System SHALL expose the frontend on port 3000 and backend on port 8000

### Requirement 7

**User Story:** Sebagai user, saya ingin API yang reliable dan memberikan feedback yang jelas, sehingga saya dapat memahami hasil operasi yang dilakukan.

#### Acceptance Criteria

1. WHEN a file upload is successful THEN the System SHALL return HTTP 200 status with a success message and record count
2. WHEN a file upload fails validation THEN the System SHALL return HTTP 400 status with detailed validation error messages
3. WHEN a comparison request is successful THEN the System SHALL return HTTP 200 status with comparison results in JSON format
4. WHEN a comparison request fails due to missing data THEN the System SHALL return HTTP 400 status with an error message indicating the missing data
5. WHEN an internal server error occurs THEN the System SHALL return HTTP 500 status without exposing internal implementation details

### Requirement 8

**User Story:** Sebagai user, saya ingin data yang diupload divalidasi dengan benar, sehingga hanya data yang valid yang disimpan ke database.

#### Acceptance Criteria

1. WHEN validating employee data THEN the System SHALL ensure NIP is non-empty and alphanumeric
2. WHEN validating employee data THEN the System SHALL ensure nomor_rekening is non-empty and numeric
3. WHEN validating employee data THEN the System SHALL ensure tgl_lahir is in valid date format
4. WHEN validating employee data THEN the System SHALL ensure kode_bank is exactly 3 characters
5. WHEN validation fails for any field THEN the System SHALL return comprehensive error messages indicating all validation failures

### Requirement 9

**User Story:** Sebagai user, saya ingin melihat arsip data pegawai dari bulan-bulan sebelumnya, sehingga saya dapat mengakses dan mencari data historis dengan mudah.

#### Acceptance Criteria

1. WHEN a user requests available months THEN the System SHALL return a list of all months with stored data including record counts
2. WHEN a user selects a specific month and year THEN the System SHALL retrieve and display all employee records for that period
3. WHEN a user provides a search term THEN the System SHALL filter archive results by NIP or Nama matching the search term
4. WHEN displaying archive data THEN the System SHALL show all employee fields in an interactive table format
5. WHEN no data exists for the selected month and year THEN the System SHALL return an appropriate message indicating no data found
