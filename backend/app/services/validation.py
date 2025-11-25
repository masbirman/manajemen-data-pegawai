from typing import List, Dict
from datetime import datetime
import re


def validate_nip(nip: str) -> bool:
    """
    Validate NIP (Nomor Induk Pegawai).
    NIP must be non-empty and alphanumeric.
    
    Args:
        nip: NIP string to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not nip or not isinstance(nip, str):
        return False
    
    # Check if non-empty after stripping whitespace
    nip = nip.strip()
    if not nip:
        return False
    
    # Check if alphanumeric
    return nip.isalnum()


def validate_nomor_rekening(rekening: str) -> bool:
    """
    Validate nomor rekening (account number).
    Must be non-empty and numeric.
    
    Args:
        rekening: Account number string to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not rekening or not isinstance(rekening, str):
        return False
    
    # Check if non-empty after stripping whitespace
    rekening = rekening.strip()
    if not rekening:
        return False
    
    # Check if numeric (digits only)
    return rekening.isdigit()


def validate_tanggal_lahir(tanggal: str) -> bool:
    """
    Validate tanggal lahir (birth date).
    Must be in valid date format (YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY).
    
    Args:
        tanggal: Date string to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not tanggal or not isinstance(tanggal, str):
        return False
    
    tanggal = tanggal.strip()
    if not tanggal:
        return False
    
    # Try multiple date formats
    date_formats = [
        '%Y-%m-%d',      # 2023-12-31
        '%d/%m/%Y',      # 31/12/2023
        '%d-%m-%Y',      # 31-12-2023
        '%Y/%m/%d',      # 2023/12/31
    ]
    
    for date_format in date_formats:
        try:
            datetime.strptime(tanggal, date_format)
            return True
        except ValueError:
            continue
    
    return False


def validate_kode_bank(kode: str) -> bool:
    """
    Validate kode bank (bank code).
    Must be exactly 3 characters.
    
    Args:
        kode: Bank code string to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not kode or not isinstance(kode, str):
        return False
    
    kode = kode.strip()
    
    # Check if exactly 3 characters
    return len(kode) == 3


def validate_employee_data(employee: Dict) -> List[str]:
    """
    Comprehensive validation of employee data.
    Returns list of validation errors.
    
    Args:
        employee: Dictionary containing employee data
        
    Returns:
        List[str]: List of validation error messages (empty if valid)
    """
    errors = []
    
    # Validate NIP
    nip = employee.get('NIP')
    if not nip:
        errors.append("NIP is required")
    elif not validate_nip(str(nip)):
        errors.append("NIP must be non-empty and alphanumeric")
    
    # Validate Nama
    nama = employee.get('Nama')
    if not nama or (isinstance(nama, str) and not nama.strip()):
        errors.append("Nama is required")
    
    # Validate NIK
    nik = employee.get('NIK')
    if not nik or (isinstance(nik, str) and not str(nik).strip()):
        errors.append("NIK is required")
    
    # Validate NPWP
    npwp = employee.get('NPWP')
    if not npwp or (isinstance(npwp, str) and not str(npwp).strip()):
        errors.append("NPWP is required")
    
    # Validate Tanggal Lahir
    tgl_lahir = employee.get('Tanggal Lahir')
    if not tgl_lahir:
        errors.append("Tanggal Lahir is required")
    elif not validate_tanggal_lahir(str(tgl_lahir)):
        errors.append("Tanggal Lahir must be in valid date format (YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY)")
    
    # Validate Kode Bank
    kode_bank = employee.get('Kode Bank')
    if not kode_bank:
        errors.append("Kode Bank is required")
    elif not validate_kode_bank(str(kode_bank)):
        errors.append("Kode Bank must be exactly 3 characters")
    
    # Validate Nama Bank
    nama_bank = employee.get('Nama Bank')
    if not nama_bank or (isinstance(nama_bank, str) and not nama_bank.strip()):
        errors.append("Nama Bank is required")
    
    # Validate Nomor Rekening
    nomor_rekening = employee.get('Nomor Rekening')
    if not nomor_rekening:
        errors.append("Nomor Rekening is required")
    elif not validate_nomor_rekening(str(nomor_rekening)):
        errors.append("Nomor Rekening must be non-empty and numeric")
    
    return errors


def check_duplicate_nip(employees: List[Dict], month: int, year: int) -> Dict[str, List[int]]:
    """
    Check for duplicate NIP entries within the same month/year.
    
    Args:
        employees: List of employee dictionaries
        month: Month number
        year: Year number
        
    Returns:
        Dict[str, List[int]]: Dictionary mapping NIP to list of row indices where duplicates occur
    """
    nip_occurrences = {}
    
    for idx, employee in enumerate(employees):
        nip = employee.get('NIP')
        if nip:
            nip_str = str(nip).strip()
            if nip_str not in nip_occurrences:
                nip_occurrences[nip_str] = []
            nip_occurrences[nip_str].append(idx)
    
    # Filter to only duplicates (NIP appearing more than once)
    duplicates = {nip: indices for nip, indices in nip_occurrences.items() if len(indices) > 1}
    
    return duplicates
