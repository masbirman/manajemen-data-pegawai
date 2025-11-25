from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.pegawai import Pegawai
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/update", tags=["update"])

# Valid status values
VALID_STATUSES = ["Aktif", "Masuk", "Keluar", "Pindah", "Pensiun", "Rekening Berbeda"]


class UpdateStatusRequest(BaseModel):
    """Request model for updating employee status."""
    id: int
    status: str


class UpdateDepartedStatusRequest(BaseModel):
    """Request model for updating departed employee status."""
    nip: str
    month: int
    year: int
    unit: str
    status: str


@router.put("/status")
async def update_status(
    request: UpdateStatusRequest,
    db: Session = Depends(get_db)
):
    """
    Update employee status for existing records.
    
    Args:
        request: UpdateStatusRequest with id and new status
        db: Database session
        
    Returns:
        Success response with updated employee data
        
    Raises:
        HTTPException 400: Invalid status or employee not found
        HTTPException 500: Internal server errors
    """
    try:
        # Validate status
        if request.status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"
            )
        
        # Find employee
        employee = db.query(Pegawai).filter(Pegawai.id == request.id).first()
        
        if not employee:
            raise HTTPException(
                status_code=404,
                detail=f"Employee with id {request.id} not found"
            )
        
        # Update status and set manual override flag
        old_status = employee.status
        employee.status = request.status
        employee.manual_override = 1  # Mark as manually overridden
        
        db.commit()
        db.refresh(employee)
        
        logger.info(f"Updated employee {employee.nip} status from {old_status} to {request.status} (manual override)")
        
        return {
            "status": "success",
            "message": f"Status updated from {old_status} to {request.status}",
            "employee": employee.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/departed-status")
async def update_departed_status(
    request: UpdateDepartedStatusRequest,
    db: Session = Depends(get_db)
):
    """
    Update status for departed employees by creating a new record in the target month.
    This is used when an employee doesn't exist in the current month (departed)
    but we want to override their status (e.g., from "Keluar" to "Pensiun").
    
    Args:
        request: UpdateDepartedStatusRequest with NIP, month, year, unit, and new status
        db: Database session
        
    Returns:
        Success response with created employee record
        
    Raises:
        HTTPException 400: Invalid status or employee data not found
        HTTPException 500: Internal server errors
    """
    try:
        logger.info(f"Received departed status update: NIP={request.nip}, month={request.month}, year={request.year}, unit={request.unit}, status={request.status}")
        
        # Validate status
        if request.status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"
            )
        
        # Check if record already exists in target month
        existing = db.query(Pegawai).filter(
            Pegawai.nip == request.nip,
            Pegawai.month == request.month,
            Pegawai.year == request.year,
            Pegawai.unit == request.unit
        ).first()
        
        if existing:
            # If record exists, just update it
            old_status = existing.status
            existing.status = request.status
            existing.manual_override = 1
            db.commit()
            db.refresh(existing)
            
            logger.info(f"Updated existing departed employee {request.nip} status from {old_status} to {request.status}")
            
            return {
                "status": "success",
                "message": f"Status updated from {old_status} to {request.status}",
                "employee": existing.to_dict()
            }
        
        # Find employee data from previous month to copy
        from app.services.month_utils import get_previous_month
        prev_month, prev_year = get_previous_month(request.month, request.year)
        
        previous_employee = db.query(Pegawai).filter(
            Pegawai.nip == request.nip,
            Pegawai.month == prev_month,
            Pegawai.year == prev_year,
            Pegawai.unit == request.unit
        ).first()
        
        if not previous_employee:
            raise HTTPException(
                status_code=404,
                detail=f"Employee with NIP {request.nip} not found in previous month ({prev_month}/{prev_year})"
            )
        
        # Create new record in target month with overridden status
        new_employee = Pegawai(
            nip=previous_employee.nip,
            nama=previous_employee.nama,
            nik=previous_employee.nik,
            npwp=previous_employee.npwp,
            tgl_lahir=previous_employee.tgl_lahir,
            kode_bank=previous_employee.kode_bank,
            nama_bank=previous_employee.nama_bank,
            nomor_rekening=previous_employee.nomor_rekening,
            unit=previous_employee.unit,
            month=request.month,
            year=request.year,
            status=request.status,
            manual_override=1  # Mark as manually overridden
        )
        
        db.add(new_employee)
        db.commit()
        db.refresh(new_employee)
        
        logger.info(f"Created new record for departed employee {request.nip} in {request.month}/{request.year} with status {request.status}")
        
        return {
            "status": "success",
            "message": f"Created new record with status {request.status} for departed employee",
            "employee": new_employee.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating departed employee status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
