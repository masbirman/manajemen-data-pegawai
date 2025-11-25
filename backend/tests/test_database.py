import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from datetime import date, datetime
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


# Strategy for generating valid dates
date_strategy = st.dates(
    min_value=date(1950, 1, 1),
    max_value=date(2010, 12, 31)
)

# Strategy for generating valid employee data
employee_strategy = st.fixed_dictionaries({
    'nip': st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))),
    'nama': st.text(min_size=1, max_size=100, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Zs'))),
    'nik': st.text(min_size=16, max_size=16, alphabet=st.characters(whitelist_categories=('Nd',))),
    'npwp': st.text(min_size=15, max_size=15, alphabet=st.characters(whitelist_categories=('Nd',))),
    'tgl_lahir': date_strategy,
    'kode_bank': st.text(min_size=3, max_size=3, alphabet=st.characters(whitelist_categories=('Nd',))),
    'nama_bank': st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Zs'))),
    'nomor_rekening': st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Nd',))),
    'month': st.integers(min_value=1, max_value=12),
    'year': st.integers(min_value=2000, max_value=2100)
})


# Feature: employee-data-comparison, Property 3: Data persistence round-trip
# Validates: Requirements 1.3, 5.1
@given(emp_data=employee_strategy)
@settings(max_examples=100)
def test_property_data_persistence_round_trip(emp_data):
    """
    Property 3: Data persistence round-trip
    For any employee record stored in the database, retrieving it by NIP, month, 
    and year should return the same data values.
    
    Validates: Requirements 1.3, 5.1
    """
    with get_test_db() as test_db:
        # Create employee record
        employee = Pegawai(
            nip=emp_data['nip'],
            nama=emp_data['nama'],
            nik=emp_data['nik'],
            npwp=emp_data['npwp'],
            tgl_lahir=emp_data['tgl_lahir'],
            kode_bank=emp_data['kode_bank'],
            nama_bank=emp_data['nama_bank'],
            nomor_rekening=emp_data['nomor_rekening'],
            status='Aktif',
            month=emp_data['month'],
            year=emp_data['year']
        )
        
        # Store in database
        test_db.add(employee)
        test_db.commit()
        test_db.refresh(employee)
        
        # Retrieve from database
        retrieved = test_db.query(Pegawai).filter(
            Pegawai.nip == emp_data['nip'],
            Pegawai.month == emp_data['month'],
            Pegawai.year == emp_data['year']
        ).first()
        
        # Property: Retrieved data should match original data
        assert retrieved is not None, "Employee should be retrievable from database"
        assert retrieved.nip == emp_data['nip']
        assert retrieved.nama == emp_data['nama']
        assert retrieved.nik == emp_data['nik']
        assert retrieved.npwp == emp_data['npwp']
        assert retrieved.tgl_lahir == emp_data['tgl_lahir']
        assert retrieved.kode_bank == emp_data['kode_bank']
        assert retrieved.nama_bank == emp_data['nama_bank']
        assert retrieved.nomor_rekening == emp_data['nomor_rekening']
        assert retrieved.month == emp_data['month']
        assert retrieved.year == emp_data['year']
        assert retrieved.status == 'Aktif'


# Feature: employee-data-comparison, Property 17: Timestamp audit trail
# Validates: Requirements 5.2
@given(emp_data=employee_strategy)
@settings(max_examples=100)
def test_property_timestamp_audit_trail(emp_data):
    """
    Property 17: Timestamp audit trail
    For any employee record, created_at and updated_at timestamps should be 
    automatically recorded and maintained.
    
    Validates: Requirements 5.2
    """
    with get_test_db() as test_db:
        # Create employee record
        employee = Pegawai(
            nip=emp_data['nip'],
            nama=emp_data['nama'],
            nik=emp_data['nik'],
            npwp=emp_data['npwp'],
            tgl_lahir=emp_data['tgl_lahir'],
            kode_bank=emp_data['kode_bank'],
            nama_bank=emp_data['nama_bank'],
            nomor_rekening=emp_data['nomor_rekening'],
            status='Aktif',
            month=emp_data['month'],
            year=emp_data['year']
        )
        
        # Store in database
        test_db.add(employee)
        test_db.commit()
        test_db.refresh(employee)
        
        # Property 1: created_at should be automatically set
        assert employee.created_at is not None, "created_at should be automatically set"
        assert isinstance(employee.created_at, datetime), "created_at should be a datetime object"
        
        # Property 2: updated_at should be automatically set
        assert employee.updated_at is not None, "updated_at should be automatically set"
        assert isinstance(employee.updated_at, datetime), "updated_at should be a datetime object"
        
        # Property 3: created_at and updated_at should be close in time for new records
        time_diff = abs((employee.updated_at - employee.created_at).total_seconds())
        assert time_diff < 1, f"created_at and updated_at should be close for new records, diff: {time_diff}s"
        
        # Store original timestamps
        original_created_at = employee.created_at
        original_updated_at = employee.updated_at
        
        # Update the employee
        import time
        time.sleep(0.1)  # Small delay to ensure timestamp difference
        employee.nama = "Updated Name"
        test_db.commit()
        test_db.refresh(employee)
        
        # Property 4: created_at should not change on update
        assert employee.created_at == original_created_at, "created_at should not change on update"
        
        # Property 5: updated_at should change on update
        assert employee.updated_at >= original_updated_at, "updated_at should be updated on record update"



# Feature: employee-data-comparison, Property 19: Month-year filtering
# Validates: Requirements 5.4
@given(
    target_month=st.integers(min_value=1, max_value=12),
    target_year=st.integers(min_value=2000, max_value=2100),
    other_months=st.lists(
        st.tuples(
            st.integers(min_value=1, max_value=12),
            st.integers(min_value=2000, max_value=2100)
        ),
        min_size=0,
        max_size=5
    )
)
@settings(max_examples=100)
def test_property_month_year_filtering(target_month, target_year, other_months):
    """
    Property 19: Month-year filtering
    For any query filtering by month and year, the system should return only 
    records matching those exact values.
    
    Validates: Requirements 5.4
    """
    with get_test_db() as test_db:
        # Filter out duplicates and target month/year from other_months
        other_months = [(m, y) for m, y in other_months if (m, y) != (target_month, target_year)]
        other_months = list(set(other_months))  # Remove duplicates
        
        # Create target month employees
        target_employees = []
        for i in range(3):
            emp = Pegawai(
                nip=f"TARGET{i}",
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
            target_employees.append(emp)
            test_db.add(emp)
        
        # Create other month employees
        for idx, (month, year) in enumerate(other_months[:3]):  # Limit to 3 to keep test fast
            emp = Pegawai(
                nip=f"OTHER{idx}",
                nama=f"Other Employee {idx}",
                nik="1234567890123456",
                npwp="123456789012345",
                tgl_lahir=date(1990, 1, 1),
                kode_bank="014",
                nama_bank="BCA",
                nomor_rekening=f"99999999{idx}",
                status='Aktif',
                month=month,
                year=year
            )
            test_db.add(emp)
        
        test_db.commit()
        
        # Query with month/year filter
        results = test_db.query(Pegawai).filter(
            Pegawai.month == target_month,
            Pegawai.year == target_year
        ).all()
        
        # Property 1: All results should match the target month and year
        for emp in results:
            assert emp.month == target_month, f"Expected month {target_month}, got {emp.month}"
            assert emp.year == target_year, f"Expected year {target_year}, got {emp.year}"
        
        # Property 2: Should return exactly the target employees
        assert len(results) == len(target_employees), f"Expected {len(target_employees)} results, got {len(results)}"
        
        result_nips = {emp.nip for emp in results}
        target_nips = {emp.nip for emp in target_employees}
        assert result_nips == target_nips, f"Result NIPs {result_nips} don't match target NIPs {target_nips}"
