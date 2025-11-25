from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.pegawai import Pegawai
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/archive", tags=["archive"])


@router.get("/data")
async def get_archive_data(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    unit: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get archived employee data with optional filtering.
    
    Args:
        month: Optional month filter (1-12)
        year: Optional year filter
        unit: Optional unit filter
        search: Optional search term (searches NIP and Nama)
        db: Database session
        
    Returns:
        List of employee records matching filters
    """
    try:
        # Start with base query
        query = db.query(Pegawai)
        
        # Apply month filter if provided
        if month is not None:
            query = query.filter(Pegawai.month == month)
        
        # Apply year filter if provided
        if year is not None:
            query = query.filter(Pegawai.year == year)
        
        # Apply unit filter if provided
        if unit is not None:
            query = query.filter(Pegawai.unit == unit)
        
        # Apply search filter if provided
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Pegawai.nip.ilike(search_term),
                    Pegawai.nama.ilike(search_term)
                )
            )
        
        # Order by year, month, and unit descending (newest first)
        query = query.order_by(
            Pegawai.year.desc(),
            Pegawai.month.desc(),
            Pegawai.unit,
            Pegawai.nip
        )
        
        # Execute query
        employees = query.all()
        
        # Convert to dictionaries
        results = [emp.to_dict() for emp in employees]
        
        return {
            "status": "success",
            "count": len(results),
            "filters": {
                "month": month,
                "year": year,
                "unit": unit,
                "search": search
            },
            "data": results
        }
        
    except Exception as e:
        logger.error(f"Error getting archive data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
