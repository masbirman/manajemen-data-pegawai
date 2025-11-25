import pytest
from hypothesis import given, strategies as st
from app.services.month_utils import get_previous_month


# Feature: employee-data-comparison, Property 6: Previous month identification
# Validates: Requirements 2.1
@given(
    month=st.integers(min_value=1, max_value=12),
    year=st.integers(min_value=2000, max_value=2100)
)
def test_property_previous_month_identification(month, year):
    """
    Property 6: Previous month identification
    For any given month and year, the system should correctly identify 
    the previous month, handling year boundaries (January → December of previous year).
    
    Validates: Requirements 2.1
    """
    prev_month, prev_year = get_previous_month(month, year)
    
    # Property 1: Previous month should be valid (1-12)
    assert 1 <= prev_month <= 12, f"Previous month {prev_month} is not valid"
    
    # Property 2: Year should be valid
    assert prev_year > 0, f"Previous year {prev_year} is not valid"
    
    # Property 3: If current month is January, previous should be December of previous year
    if month == 1:
        assert prev_month == 12, f"For January, previous month should be 12, got {prev_month}"
        assert prev_year == year - 1, f"For January, previous year should be {year - 1}, got {prev_year}"
    else:
        # Property 4: For any other month, previous month should be current - 1, same year
        assert prev_month == month - 1, f"For month {month}, previous month should be {month - 1}, got {prev_month}"
        assert prev_year == year, f"For month {month} (not January), year should remain {year}, got {prev_year}"
