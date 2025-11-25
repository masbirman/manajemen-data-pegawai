from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.pegawai import Pegawai
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


class DeleteRequest(BaseModel):
    """Request model for deleting data."""
    month: int
    year: int
    unit: str


@router.delete("/data")
async def delete_data(
    request: DeleteRequest,
    db: Session = Depends(get_db)
):
    """
    Delete all employee data for a specific month/year/unit.
    Admin function to clean up data.
    
    Args:
        request: DeleteRequest with month, year, and unit
        db: Database session
        
    Returns:
        Success message with count of deleted records
        
    Raises:
        HTTPException 400: Invalid parameters
        HTTPException 404: No data found
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
        
        # Check if data exists
        count = db.query(Pegawai).filter(
            Pegawai.month == month,
            Pegawai.year == year,
            Pegawai.unit == unit
        ).count()
        
        if count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for {unit} {month}/{year}"
            )
        
        # Delete data
        logger.info(f"Deleting {count} records for {unit} {month}/{year}")
        db.query(Pegawai).filter(
            Pegawai.month == month,
            Pegawai.year == year,
            Pegawai.unit == unit
        ).delete()
        
        db.commit()
        logger.info(f"Successfully deleted {count} records")
        
        return {
            "status": "success",
            "message": f"Successfully deleted data for {unit} {month}/{year}",
            "records_deleted": count,
            "month": month,
            "year": year,
            "unit": unit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/months")
async def get_available_months(db: Session = Depends(get_db)):
    """
    Get list of all available months with data.
    
    Returns:
        List of months with record counts
    """
    try:
        # Query distinct month/year combinations with counts
        from sqlalchemy import func
        
        results = db.query(
            Pegawai.month,
            Pegawai.year,
            Pegawai.unit,
            func.count(Pegawai.id).label('count')
        ).group_by(
            Pegawai.month,
            Pegawai.year,
            Pegawai.unit
        ).order_by(
            Pegawai.year.desc(),
            Pegawai.month.desc(),
            Pegawai.unit
        ).all()
        
        months = [
            {
                "month": row.month,
                "year": row.year,
                "unit": row.unit,
                "count": row.count
            }
            for row in results
        ]
        
        return {
            "status": "success",
            "months": months
        }
        
    except Exception as e:
        logger.error(f"Error getting available months: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")



@router.get("/data/{month}/{year}")
async def get_archive_data(
    month: int,
    year: int,
    search: str = None,
    db: Session = Depends(get_db)
):
    """
    Get archive data for a specific month/year with optional search.
    
    Args:
        month: Month number (1-12)
        year: Year number
        search: Optional search term for NIP or Nama
        db: Database session
        
    Returns:
        List of employee records for the specified month/year
    """
    try:
        # Validate month and year
        if not (1 <= month <= 12):
            raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
        
        if year < 2000 or year > 2100:
            raise HTTPException(status_code=400, detail="Year must be between 2000 and 2100")
        
        # Base query
        query = db.query(Pegawai).filter(
            Pegawai.month == month,
            Pegawai.year == year
        )
        
        # Add search filter if provided
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Pegawai.nip.ilike(search_term)) |
                (Pegawai.nama.ilike(search_term))
            )
        
        # Execute query
        employees = query.order_by(Pegawai.nip).all()
        
        # Convert to dict
        results = [emp.to_dict() for emp in employees]
        
        return {
            "status": "success",
            "month": month,
            "year": year,
            "search": search,
            "count": len(results),
            "data": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting archive data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
