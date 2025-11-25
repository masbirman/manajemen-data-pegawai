import pytest
from hypothesis import given, strategies as st
from datetime import date
from app.services.comparator import EmployeeComparator
from app.models.pegawai import Pegawai


# Helper function to create test employee
def create_test_employee(nip, nama="Test", nomor_rekening="1234567890", month=1, year=2024):
    """Create a test Pegawai object."""
    emp = Pegawai(
        nip=nip,
        nama=nama,
        nik="1234567890123456",
        npwp="123456789012345",
        tgl_lahir=date(1990, 1, 1),
        kode_bank="014",
        nama_bank="BCA",
        nomor_rekening=nomor_rekening,
        status="Aktif",
        month=month,
        year=year
    )
    return emp


# Feature: employee-data-comparison, Property 9: New employee identification
# Validates: Requirements 3.1
@given(
    new_nip=st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))),
    existing_nips=st.lists(st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))), min_size=0, max_size=10)
)
def test_property_new_employee_identification(new_nip, existing_nips):
    """
    Property 9: New employee identification
    For any employee present in current month data but not in comparison month data,
    the system should assign Status Masuk.
    
    Validates: Requirements 3.1
    """
    # Ensure new_nip is not in existing_nips
    existing_nips = [nip for nip in existing_nips if nip != new_nip]
    
    # Create previous month employees
    previous = [create_test_employee(nip, month=11, year=2024) for nip in existing_nips]
    
    # Create current month employees (includes all previous + new one)
    current = [create_test_employee(nip, month=12, year=2024) for nip in existing_nips]
    current.append(create_test_employee(new_nip, month=12, year=2024))
    
    # Identify new employees
    new_employees = EmployeeComparator.identify_new_employees(current, previous)
    
    # Property: The new employee should be identified
    new_nips = [emp.nip for emp in new_employees]
    assert new_nip in new_nips, f"New employee with NIP {new_nip} should be identified"
    
    # Property: Only the new employee should be identified (no false positives)
    assert len(new_employees) == 1, f"Expected 1 new employee, got {len(new_employees)}"


# Feature: employee-data-comparison, Property 10: Departed employee identification
# Validates: Requirements 3.2
@given(
    departed_nip=st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))),
    remaining_nips=st.lists(st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))), min_size=0, max_size=10)
)
def test_property_departed_employee_identification(departed_nip, remaining_nips):
    """
    Property 10: Departed employee identification
    For any employee present in comparison month data but not in current month data,
    the system should assign Status Keluar.
    
    Validates: Requirements 3.2
    """
    # Ensure departed_nip is not in remaining_nips
    remaining_nips = [nip for nip in remaining_nips if nip != departed_nip]
    
    # Create previous month employees (includes departed + remaining)
    previous = [create_test_employee(nip, month=11, year=2024) for nip in remaining_nips]
    previous.append(create_test_employee(departed_nip, month=11, year=2024))
    
    # Create current month employees (only remaining, no departed)
    current = [create_test_employee(nip, month=12, year=2024) for nip in remaining_nips]
    
    # Identify departed employees
    departed_employees = EmployeeComparator.identify_departed_employees(current, previous)
    
    # Property: The departed employee should be identified
    departed_nips = [emp.nip for emp in departed_employees]
    assert departed_nip in departed_nips, f"Departed employee with NIP {departed_nip} should be identified"
    
    # Property: Only the departed employee should be identified (no false positives)
    assert len(departed_employees) == 1, f"Expected 1 departed employee, got {len(departed_employees)}"


# Feature: employee-data-comparison, Property 11: Account change detection
# Validates: Requirements 3.3
@given(
    nip=st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))),
    old_account=st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Nd',))),
    new_account=st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Nd',)))
)
def test_property_account_change_detection(nip, old_account, new_account):
    """
    Property 11: Account change detection
    For any employee present in both months with different nomor_rekening values,
    the system should assign Status Rekening Berbeda.
    
    Validates: Requirements 3.3
    """
    # Ensure accounts are different
    if old_account == new_account:
        new_account = new_account + "1"
    
    # Create previous month employee with old account
    previous = [create_test_employee(nip, nomor_rekening=old_account, month=11, year=2024)]
    
    # Create current month employee with new account
    current = [create_test_employee(nip, nomor_rekening=new_account, month=12, year=2024)]
    
    # Identify account changes
    account_changes = EmployeeComparator.identify_account_changes(current, previous)
    
    # Property: The account change should be detected
    assert len(account_changes) == 1, f"Expected 1 account change, got {len(account_changes)}"
    
    changed_emp, old_acc = account_changes[0]
    assert changed_emp.nip == nip, f"Expected NIP {nip}, got {changed_emp.nip}"
    assert old_acc == old_account, f"Expected old account {old_account}, got {old_acc}"
    assert changed_emp.nomor_rekening == new_account, f"Expected new account {new_account}, got {changed_emp.nomor_rekening}"


# Feature: employee-data-comparison, Property 12: Unchanged employee identification
# Validates: Requirements 3.4
@given(
    nip=st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))),
    account=st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Nd',)))
)
def test_property_unchanged_employee_identification(nip, account):
    """
    Property 12: Unchanged employee identification
    For any employee present in both months with identical data,
    the system should maintain their status without modification.
    
    Validates: Requirements 3.4
    """
    # Create previous month employee
    previous = [create_test_employee(nip, nomor_rekening=account, month=11, year=2024)]
    
    # Create current month employee with same data
    current = [create_test_employee(nip, nomor_rekening=account, month=12, year=2024)]
    
    # Identify unchanged employees
    unchanged = EmployeeComparator.identify_unchanged_employees(current, previous)
    
    # Property: The employee should be identified as unchanged
    assert len(unchanged) == 1, f"Expected 1 unchanged employee, got {len(unchanged)}"
    assert unchanged[0].nip == nip, f"Expected NIP {nip}, got {unchanged[0].nip}"
    assert unchanged[0].nomor_rekening == account, f"Expected account {account}, got {unchanged[0].nomor_rekening}"
