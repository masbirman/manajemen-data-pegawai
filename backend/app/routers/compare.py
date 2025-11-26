from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.pegawai import Pegawai
from app.services.month_utils import get_comparison_month_data
from app.services.comparator import EmployeeComparator
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/compare", tags=["compare"])


class CompareRequest(BaseModel):
    """Request model for comparison endpoint."""
    month: int
    year: int
    unit: str


@router.post("")
async def compare_data(
    request: CompareRequest,
    db: Session = Depends(get_db)
):
    """
    Compare employee data between current month and previous month.
    
    Args:
        request: CompareRequest with month and year
        db: Database session
        
    Returns:
        Comparison results in JSON format with summary statistics
        
    Raises:
        HTTPException 400: Missing data or invalid parameters
        HTTPException 500: Internal server errors
    """
    try:
        month = request.month
        year = request.year
        unit = request.unit
        
        # Validate month and year
        if not (1 <= month <= 12):
            raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
        
        if year < 2000 or year > 2100:
            raise HTTPException(status_code=400, detail="Year must be between 2000 and 2100")
        
        # Query current month data
        logger.info(f"Querying data for {unit} {month}/{year}")
        current_data = db.query(Pegawai).filter(
            Pegawai.month == month,
            Pegawai.year == year,
            Pegawai.unit == unit
        ).all()
        
        if not current_data:
            raise HTTPException(
                status_code=400,
                detail=f"No data found for {unit} {month}/{year}. Please upload data first."
            )
        
        # Get comparison month data
        logger.info(f"Getting comparison month data")
        comparison_data = get_comparison_month_data(db, month, year, unit)
        
        # Perform comparison
        logger.info(f"Comparing {len(current_data)} current records with {len(comparison_data)} comparison records")
        comparison_result = EmployeeComparator.compare_months(current_data, comparison_data)
        
        # Update database with status indicators
        # Only update if manual_override is not set (0 or NULL)
        logger.info("Updating database with comparison results")
        
        # Update new employees (Status Masuk)
        for emp_dict in comparison_result.new_employees:
            db.query(Pegawai).filter(
                Pegawai.nip == emp_dict['nip'],
                Pegawai.month == month,
                Pegawai.year == year,
                Pegawai.unit == unit,
                Pegawai.manual_override == 0  # Only update if not manually overridden
            ).update({'status': 'Masuk'})
        
        # Update account changes (Status Rekening Berbeda)
        for emp_dict in comparison_result.account_changes:
            db.query(Pegawai).filter(
                Pegawai.nip == emp_dict['nip'],
                Pegawai.month == month,
                Pegawai.year == year,
                Pegawai.unit == unit,
                Pegawai.manual_override == 0  # Only update if not manually overridden
            ).update({'status': 'Rekening Berbeda'})
        
        # Update unchanged employees (Status Aktif)
        for emp_dict in comparison_result.unchanged_employees:
            db.query(Pegawai).filter(
                Pegawai.nip == emp_dict['nip'],
                Pegawai.month == month,
                Pegawai.year == year,
                Pegawai.unit == unit,
                Pegawai.manual_override == 0  # Only update if not manually overridden
            ).update({'status': 'Aktif'})
        
        # Save departed employees to current month database with status "Keluar"
        # This ensures they appear in comparison view and can be edited (e.g., change to Pensiun)
        from app.services.month_utils import get_previous_month
        prev_month, prev_year = get_previous_month(month, year)
        
        for emp_dict in comparison_result.departed_employees:
            # Check if record already exists in current month (e.g., from manual override)
            existing = db.query(Pegawai).filter(
                Pegawai.nip == emp_dict['nip'],
                Pegawai.month == month,
                Pegawai.year == year,
                Pegawai.unit == unit
            ).first()
            
            if not existing:
                # Get full employee data from previous month
                prev_employee = db.query(Pegawai).filter(
                    Pegawai.nip == emp_dict['nip'],
                    Pegawai.month == prev_month,
                    Pegawai.year == prev_year,
                    Pegawai.unit == unit
                ).first()
                
                if prev_employee:
                    # Create new record in current month with status "Keluar"
                    new_departed = Pegawai(
                        nip=prev_employee.nip,
                        nama=prev_employee.nama,
                        nik=prev_employee.nik,
                        npwp=prev_employee.npwp,
                        tgl_lahir=prev_employee.tgl_lahir,
                        kode_bank=prev_employee.kode_bank,
                        nama_bank=prev_employee.nama_bank,
                        nomor_rekening=prev_employee.nomor_rekening,
                        unit=prev_employee.unit,
                        month=month,
                        year=year,
                        status='Keluar',
                        manual_override=0
                    )
                    db.add(new_departed)
                    logger.info(f"Added departed employee {prev_employee.nip} to {month}/{year} with status Keluar")
        
        db.commit()
        logger.info("Database updated successfully")
        
        # Query current month data again to get updated status in original upload order
        # Order by ID to preserve upload order
        # Now includes departed employees that were just added
        current_data_updated = db.query(Pegawai).filter(
            Pegawai.month == month,
            Pegawai.year == year,
            Pegawai.unit == unit
        ).order_by(Pegawai.id).all()
        
        # Convert to dict, preserving upload order
        all_results = [emp.to_dict() for emp in current_data_updated]
        
        # Update departed_employees list with the new records from database
        departed_from_db = [emp.to_dict() for emp in current_data_updated if emp.status == 'Keluar']
        
        return {
            "status": "success",
            "month": month,
            "year": year,
            "unit": unit,
            "summary": {
                "total_current": comparison_result.summary.total_current,
                "total_previous": comparison_result.summary.total_previous,
                "new_count": comparison_result.summary.new_count,
                "departed_count": comparison_result.summary.departed_count,
                "account_change_count": comparison_result.summary.account_change_count,
                "unchanged_count": comparison_result.summary.unchanged_count
            },
            "results": all_results,
            "new_employees": comparison_result.new_employees,
            "departed_employees": comparison_result.departed_employees,
            "account_changes": comparison_result.account_changes,
            "unchanged_employees": comparison_result.unchanged_employees
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during comparison: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
