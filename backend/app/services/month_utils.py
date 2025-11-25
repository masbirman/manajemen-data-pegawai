from typing import Tuple, List
from sqlalchemy.orm import Session
from app.models.pegawai import Pegawai


def get_previous_month(month: int, year: int) -> Tuple[int, int]:
    """
    Calculate the previous month from given month/year.
    Handles year boundary transitions (January → December of previous year).
    
    Args:
        month: Current month (1-12)
        year: Current year
        
    Returns:
        Tuple[int, int]: (previous_month, previous_year)
    """
    if month == 1:
        # January → December of previous year
        return (12, year - 1)
    else:
        # Any other month → previous month same year
        return (month - 1, year)


def get_comparison_month_data(db: Session, month: int, year: int, unit: str) -> List[Pegawai]:
    """
    Retrieve all employee records for the comparison month.
    The comparison month is the previous month from the given month/year.
    
    Args:
        db: Database session
        month: Current month (1-12)
        year: Current year
        unit: Unit kerja
        
    Returns:
        List[Pegawai]: List of employee records from comparison month
    """
    # Get previous month
    prev_month, prev_year = get_previous_month(month, year)
    
    # Query database for all employees in that month/year/unit
    employees = db.query(Pegawai).filter(
        Pegawai.month == prev_month,
        Pegawai.year == prev_year,
        Pegawai.unit == unit
    ).all()
    
    return employees


def get_most_recent_comparison_month(db: Session, month: int, year: int, unit: str) -> Tuple[int, int, List[Pegawai]]:
    """
    Get the most recent comparison month that has data.
    Searches backwards from the given month/year until data is found.
    
    Args:
        db: Database session
        month: Current month (1-12)
        year: Current year
        unit: Unit kerja
        
    Returns:
        Tuple[int, int, List[Pegawai]]: (comparison_month, comparison_year, employee_records)
        Returns (None, None, []) if no comparison data exists
    """
    search_month, search_year = get_previous_month(month, year)
    max_iterations = 12  # Search up to 12 months back
    
    for _ in range(max_iterations):
        employees = db.query(Pegawai).filter(
            Pegawai.month == search_month,
            Pegawai.year == search_year,
            Pegawai.unit == unit
        ).all()
        
        if employees:
            return (search_month, search_year, employees)
        
        # Move to previous month
        search_month, search_year = get_previous_month(search_month, search_year)
    
    # No data found
    return (None, None, [])
