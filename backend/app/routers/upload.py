from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models.pegawai import Pegawai
from app.services.excel_parser import ExcelParser
from app.services.validation import validate_employee_data, check_duplicate_nip
from datetime import datetime
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["upload"])

# Valid unit values
VALID_UNITS = [
    "Dinas",
    "Cabdis Wil. 1",
    "Cabdis Wil. 2",
    "Cabdis Wil. 3",
    "Cabdis Wil. 4",
    "Cabdis Wil. 5",
    "Cabdis Wil. 6",
    "PPPK"
]


def parse_date(date_str: str) -> datetime.date:
    """
    Parse date string to date object.
    Supports multiple formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY.
    """
    date_formats = ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y/%m/%d']
    
    for date_format in date_formats:
        try:
            return datetime.strptime(str(date_str), date_format).date()
        except ValueError:
            continue
    
    raise ValueError(f"Unable to parse date: {date_str}")


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    month: int = Form(...),
    year: int = Form(...),
    unit: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Upload Excel file containing employee data.
    
    Args:
        file: Excel file (.xlsx or .csv)
        month: Month number (1-12)
        year: Year number
        unit: Unit kerja (must be one of VALID_UNITS)
        db: Database session
        
    Returns:
        Success response with record count
        
    Raises:
        HTTPException 400: Validation errors or duplicate NIPs
        HTTPException 500: Internal server errors
    """
    try:
        # Validate month and year
        if not (1 <= month <= 12):
            raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
        
        if year < 2000 or year > 2100:
            raise HTTPException(status_code=400, detail="Year must be between 2000 and 2100")
        
        # Validate unit
        if unit not in VALID_UNITS:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid unit. Must be one of: {', '.join(VALID_UNITS)}"
            )
        
        # Parse and validate Excel file
        logger.info(f"Parsing file: {file.filename}")
        try:
            records = await ExcelParser.parse_and_validate(file)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        if not records:
            raise HTTPException(status_code=400, detail="File contains no data")
        
        # Check for duplicate NIPs within the upload
        duplicates = check_duplicate_nip(records, month, year)
        if duplicates:
            duplicate_details = []
            for nip, indices in duplicates.items():
                duplicate_details.append(f"NIP {nip} appears at rows {indices}")
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate NIP entries found: {'; '.join(duplicate_details)}"
            )
        
        # Validate all employee data
        all_errors = []
        for idx, employee in enumerate(records):
            errors = validate_employee_data(employee)
            if errors:
                all_errors.append(f"Row {idx + 1}: {'; '.join(errors)}")
        
        if all_errors:
            raise HTTPException(
                status_code=400,
                detail=f"Validation errors: {' | '.join(all_errors)}"
            )
        
        # Store validated data in database
        logger.info(f"Storing {len(records)} records to database")
        stored_count = 0
        
        for employee in records:
            try:
                # Parse date
                tgl_lahir = parse_date(employee['Tanggal Lahir'])
                
                # Create Pegawai object
                pegawai = Pegawai(
                    nip=str(employee['NIP']).strip(),
                    nama=str(employee['Nama']).strip(),
                    nik=str(employee['NIK']).strip(),
                    npwp=str(employee['NPWP']).strip(),
                    tgl_lahir=tgl_lahir,
                    kode_bank=str(employee['Kode Bank']).strip(),
                    nama_bank=str(employee['Nama Bank']).strip(),
                    nomor_rekening=str(employee['Nomor Rekening']).strip(),
                    status='Aktif',
                    unit=unit,
                    month=month,
                    year=year
                )
                
                db.add(pegawai)
                stored_count += 1
                
            except Exception as e:
                logger.error(f"Error storing employee {employee.get('NIP')}: {e}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Error storing employee {employee.get('NIP')}: {str(e)}"
                )
        
        # Check if data already exists for this month/year/unit
        existing_count = db.query(Pegawai).filter(
            Pegawai.month == month,
            Pegawai.year == year,
            Pegawai.unit == unit
        ).count()
        
        if existing_count > 0:
            # Delete existing data for this month/year/unit
            logger.info(f"Found {existing_count} existing records for {unit} {month}/{year}. Replacing...")
            db.query(Pegawai).filter(
                Pegawai.month == month,
                Pegawai.year == year,
                Pegawai.unit == unit
            ).delete()
        
        # Commit all changes
        try:
            db.commit()
            logger.info(f"Successfully stored {stored_count} records")
        except IntegrityError as e:
            db.rollback()
            logger.error(f"Database integrity error: {e}")
            raise HTTPException(
                status_code=400,
                detail="Database error occurred during upload"
            )
        
        return {
            "status": "success",
            "message": "File successfully uploaded and processed",
            "records_processed": stored_count,
            "month": month,
            "year": year,
            "unit": unit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during upload: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
