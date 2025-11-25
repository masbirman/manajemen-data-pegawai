import pytest
from hypothesis import given, strategies as st, settings
from app.services.validation import (
    validate_nip,
    validate_nomor_rekening,
    validate_tanggal_lahir,
    validate_kode_bank,
    validate_employee_data,
    check_duplicate_nip
)


# Feature: employee-data-comparison, Property 4: Duplicate NIP rejection
# Validates: Requirements 1.4
@given(
    nip=st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))),
    num_duplicates=st.integers(min_value=2, max_value=5),
    month=st.integers(min_value=1, max_value=12),
    year=st.integers(min_value=2000, max_value=2100)
)
@settings(max_examples=100)
def test_property_duplicate_nip_rejection(nip, num_duplicates, month, year):
    """
    Property 4: Duplicate NIP rejection
    For any upload attempt with duplicate NIP entries within the same month and year,
    the system should reject the upload.
    
    Validates: Requirements 1.4
    """
    # Create list of employees with duplicate NIPs
    employees = []
    for i in range(num_duplicates):
        emp = {
            'NIP': nip,
            'Nama': f'Employee {i}',
            'NIK': '1234567890123456',
            'NPWP': '123456789012345',
            'Tanggal Lahir': '1990-01-01',
            'Kode Bank': '014',
            'Nama Bank': 'BCA',
            'Nomor Rekening': f'12345678{i}'
        }
        employees.append(emp)
    
    # Check for duplicates
    duplicates = check_duplicate_nip(employees, month, year)
    
    # Property 1: Duplicates should be detected
    assert len(duplicates) > 0, "Duplicate NIPs should be detected"
    
    # Property 2: The NIP should be in the duplicates dict
    assert nip in duplicates, f"NIP {nip} should be identified as duplicate"
    
    # Property 3: All occurrences should be reported
    assert len(duplicates[nip]) == num_duplicates, \
        f"Expected {num_duplicates} occurrences, got {len(duplicates[nip])}"


# Feature: employee-data-comparison, Property 24: Comprehensive field validation
# Validates: Requirements 8.1, 8.2, 8.3, 8.4
@given(
    nip=st.one_of(
        st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))),
        st.just(''),
        st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Zs', 'P')))
    ),
    nomor_rekening=st.one_of(
        st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Nd',))),
        st.just(''),
        st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll')))
    ),
    kode_bank=st.one_of(
        st.text(min_size=3, max_size=3, alphabet=st.characters(whitelist_categories=('Nd',))),
        st.text(min_size=1, max_size=2, alphabet=st.characters(whitelist_categories=('Nd',))),
        st.text(min_size=4, max_size=10, alphabet=st.characters(whitelist_categories=('Nd',)))
    )
)
@settings(max_examples=100)
def test_property_comprehensive_field_validation(nip, nomor_rekening, kode_bank):
    """
    Property 24: Comprehensive field validation
    For any employee data, validation should check NIP (non-empty, alphanumeric),
    nomor_rekening (non-empty, numeric), tgl_lahir (valid date), and 
    kode_bank (exactly 3 characters).
    
    Validates: Requirements 8.1, 8.2, 8.3, 8.4
    """
    # Test NIP validation
    nip_valid = validate_nip(nip)
    if nip and nip.strip() and nip.strip().isalnum():
        assert nip_valid, f"Valid NIP '{nip}' should pass validation"
    else:
        assert not nip_valid, f"Invalid NIP '{nip}' should fail validation"
    
    # Test nomor rekening validation
    rekening_valid = validate_nomor_rekening(nomor_rekening)
    if nomor_rekening and nomor_rekening.strip() and nomor_rekening.strip().isdigit():
        assert rekening_valid, f"Valid nomor rekening '{nomor_rekening}' should pass validation"
    else:
        assert not rekening_valid, f"Invalid nomor rekening '{nomor_rekening}' should fail validation"
    
    # Test kode bank validation
    kode_valid = validate_kode_bank(kode_bank)
    if kode_bank and len(kode_bank.strip()) == 3:
        assert kode_valid, f"Valid kode bank '{kode_bank}' should pass validation"
    else:
        assert not kode_valid, f"Invalid kode bank '{kode_bank}' should fail validation"
    
    # Test tanggal lahir validation
    valid_dates = ['2023-12-31', '31/12/2023', '31-12-2023']
    invalid_dates = ['invalid', '2023-13-01', '32/12/2023', '']
    
    for date_str in valid_dates:
        assert validate_tanggal_lahir(date_str), f"Valid date '{date_str}' should pass validation"
    
    for date_str in invalid_dates:
        assert not validate_tanggal_lahir(date_str), f"Invalid date '{date_str}' should fail validation"


# Feature: employee-data-comparison, Property 25: Validation failure handling
# Validates: Requirements 8.5
@given(
    include_nip_error=st.booleans(),
    include_rekening_error=st.booleans(),
    include_kode_bank_error=st.booleans(),
    include_date_error=st.booleans()
)
@settings(max_examples=100)
def test_property_validation_failure_handling(
    include_nip_error,
    include_rekening_error,
    include_kode_bank_error,
    include_date_error
):
    """
    Property 25: Validation failure handling
    For any employee data with multiple validation failures, the system should 
    return comprehensive error messages indicating all failures.
    
    Validates: Requirements 8.5
    """
    # Create employee data with intentional errors
    employee = {
        'NIP': '' if include_nip_error else 'ABC123',
        'Nama': 'Test Employee',
        'NIK': '1234567890123456',
        'NPWP': '123456789012345',
        'Tanggal Lahir': 'invalid-date' if include_date_error else '1990-01-01',
        'Kode Bank': '12' if include_kode_bank_error else '014',
        'Nama Bank': 'BCA',
        'Nomor Rekening': 'ABC' if include_rekening_error else '1234567890'
    }
    
    # Validate
    errors = validate_employee_data(employee)
    
    # Count expected errors
    expected_error_count = sum([
        include_nip_error,
        include_rekening_error,
        include_kode_bank_error,
        include_date_error
    ])
    
    # Property 1: If there are errors, they should all be reported
    if expected_error_count > 0:
        assert len(errors) >= expected_error_count, \
            f"Expected at least {expected_error_count} errors, got {len(errors)}: {errors}"
    
    # Property 2: If no errors, validation should pass
    if expected_error_count == 0:
        assert len(errors) == 0, f"Expected no errors, got {len(errors)}: {errors}"
    
    # Property 3: Error messages should be descriptive
    for error in errors:
        assert isinstance(error, str), "Error messages should be strings"
        assert len(error) > 0, "Error messages should not be empty"
