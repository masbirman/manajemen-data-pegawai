import pytest
from hypothesis import given, strategies as st, settings
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
from app.models.pegawai import Pegawai
from app.database import Base


# Context manager for creating test database
@contextmanager
def get_test_db():
    """Create a test database session."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestSessionLocal = sessionmaker(bind=engine)
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Feature: employee-data-comparison, Property 26: Available months retrieval
# Validates: Requirements 9.1
@given(
    months_data=st.lists(
        st.tuples(
            st.integers(min_value=1, max_value=12),
            st.integers(min_value=2000, max_value=2100),
            st.integers(min_value=1, max_value=10)  # number of employees
        ),
        min_size=1,
        max_size=5,
        unique_by=lambda x: (x[0], x[1])  # unique month/year combinations
    )
)
@settings(max_examples=100)
def test_property_available_months_retrieval(months_data):
    """
    Property 26: Available months retrieval
    For any database state with stored employee data, the system should return 
    all distinct month/year combinations with accurate record counts.
    
    Validates: Requirements 9.1
    """
    with get_test_db() as test_db:
        from sqlalchemy import func
        
        # Store employees for each month/year
        expected_months = {}
        for month, year, num_employees in months_data:
            for i in range(num_employees):
                emp = Pegawai(
                    nip=f"NIP{month}{year}{i}",
                    nama=f"Employee {i}",
                    nik="1234567890123456",
                    npwp="123456789012345",
                    tgl_lahir=date(1990, 1, 1),
                    kode_bank="014",
                    nama_bank="BCA",
                    nomor_rekening=f"12345678{i}",
                    status='Aktif',
                    month=month,
                    year=year
                )
                test_db.add(emp)
            
            expected_months[(month, year)] = num_employees
        
        test_db.commit()
        
        # Query available months (simulating the API endpoint logic)
        results = test_db.query(
            Pegawai.month,
            Pegawai.year,
            func.count(Pegawai.id).label('count')
        ).group_by(
            Pegawai.month,
            Pegawai.year
        ).all()
        
        # Property 1: All stored month/year combinations should be returned
        result_months = {(row.month, row.year): row.count for row in results}
        assert result_months == expected_months, \
            f"Expected months {expected_months}, got {result_months}"
        
        # Property 2: Record counts should be accurate
        for (month, year), expected_count in expected_months.items():
            actual_count = result_months.get((month, year), 0)
            assert actual_count == expected_count, \
                f"For {month}/{year}, expected {expected_count} records, got {actual_count}"


# Feature: employee-data-comparison, Property 27: Archive data retrieval by month/year
# Validates: Requirements 9.2
@given(
    target_month=st.integers(min_value=1, max_value=12),
    target_year=st.integers(min_value=2000, max_value=2100),
    num_target_employees=st.integers(min_value=1, max_value=10),
    num_other_employees=st.integers(min_value=0, max_value=5)
)
@settings(max_examples=100)
def test_property_archive_data_retrieval(
    target_month,
    target_year,
    num_target_employees,
    num_other_employees
):
    """
    Property 27: Archive data retrieval by month/year
    For any valid month and year with stored data, the system should retrieve 
    all employee records for that specific period.
    
    Validates: Requirements 9.2
    """
    with get_test_db() as test_db:
        # Create target month employees
        target_nips = []
        for i in range(num_target_employees):
            nip = f"TARGET{i}"
            target_nips.append(nip)
            emp = Pegawai(
                nip=nip,
                nama=f"Target Employee {i}",
                nik="1234567890123456",
                npwp="123456789012345",
                tgl_lahir=date(1990, 1, 1),
                kode_bank="014",
                nama_bank="BCA",
                nomor_rekening=f"12345678{i}",
                status='Aktif',
                month=target_month,
                year=target_year
            )
            test_db.add(emp)
        
        # Create other month employees
        other_month = (target_month % 12) + 1
        other_year = target_year if other_month != 1 else target_year + 1
        
        for i in range(num_other_employees):
            emp = Pegawai(
                nip=f"OTHER{i}",
                nama=f"Other Employee {i}",
                nik="1234567890123456",
                npwp="123456789012345",
                tgl_lahir=date(1990, 1, 1),
                kode_bank="014",
                nama_bank="BCA",
                nomor_rekening=f"99999999{i}",
                status='Aktif',
                month=other_month,
                year=other_year
            )
            test_db.add(emp)
        
        test_db.commit()
        
        # Query archive data for target month/year
        results = test_db.query(Pegawai).filter(
            Pegawai.month == target_month,
            Pegawai.year == target_year
        ).all()
        
        # Property 1: Should return exactly the target employees
        assert len(results) == num_target_employees, \
            f"Expected {num_target_employees} employees, got {len(results)}"
        
        # Property 2: All returned employees should match target month/year
        for emp in results:
            assert emp.month == target_month, \
                f"Expected month {target_month}, got {emp.month}"
            assert emp.year == target_year, \
                f"Expected year {target_year}, got {emp.year}"
        
        # Property 3: All target NIPs should be present
        result_nips = {emp.nip for emp in results}
        expected_nips = set(target_nips)
        assert result_nips == expected_nips, \
            f"Expected NIPs {expected_nips}, got {result_nips}"


# Feature: employee-data-comparison, Property 28: Archive search filtering
# Validates: Requirements 9.3
@given(
    search_term=st.text(min_size=1, max_size=10, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))),
    num_matching=st.integers(min_value=1, max_value=5),
    num_non_matching=st.integers(min_value=0, max_value=5)
)
@settings(max_examples=100)
def test_property_archive_search_filtering(search_term, num_matching, num_non_matching):
    """
    Property 28: Archive search filtering
    For any search term and archive data, the system should return only records 
    where NIP or Nama contains the search term (case-insensitive).
    
    Validates: Requirements 9.3
    """
    with get_test_db() as test_db:
        month = 12
        year = 2024
        
        # Create matching employees (contain search term in NIP or Nama)
        matching_nips = []
        for i in range(num_matching):
            nip = f"{search_term}MATCH{i}"
            matching_nips.append(nip)
            emp = Pegawai(
                nip=nip,
                nama=f"Employee {i}",
                nik="1234567890123456",
                npwp="123456789012345",
                tgl_lahir=date(1990, 1, 1),
                kode_bank="014",
                nama_bank="BCA",
                nomor_rekening=f"12345678{i}",
                status='Aktif',
                month=month,
                year=year
            )
            test_db.add(emp)
        
        # Create non-matching employees
        for i in range(num_non_matching):
            # Use different characters to ensure no match
            nip = f"NOMATCH{i}XYZ"
            # Make sure search_term is not in nip or nama
            if search_term.lower() not in nip.lower():
                emp = Pegawai(
                    nip=nip,
                    nama=f"Different Employee {i}",
                    nik="1234567890123456",
                    npwp="123456789012345",
                    tgl_lahir=date(1990, 1, 1),
                    kode_bank="014",
                    nama_bank="BCA",
                    nomor_rekening=f"99999999{i}",
                    status='Aktif',
                    month=month,
                    year=year
                )
                test_db.add(emp)
        
        test_db.commit()
        
        # Query with search filter (simulating API endpoint logic)
        search_pattern = f"%{search_term}%"
        results = test_db.query(Pegawai).filter(
            Pegawai.month == month,
            Pegawai.year == year
        ).filter(
            (Pegawai.nip.ilike(search_pattern)) |
            (Pegawai.nama.ilike(search_pattern))
        ).all()
        
        # Property 1: All results should contain the search term (case-insensitive)
        for emp in results:
            nip_match = search_term.lower() in emp.nip.lower()
            nama_match = search_term.lower() in emp.nama.lower()
            assert nip_match or nama_match, \
                f"Employee {emp.nip} / {emp.nama} should contain '{search_term}'"
        
        # Property 2: Should return at least the matching employees
        result_nips = {emp.nip for emp in results}
        expected_nips = set(matching_nips)
        assert expected_nips.issubset(result_nips), \
            f"Expected NIPs {expected_nips} should be in results {result_nips}"
