from typing import List, Dict
from app.models.pegawai import Pegawai
from dataclasses import dataclass


@dataclass
class ComparisonSummary:
    """Summary statistics for comparison results."""
    total_current: int
    total_previous: int
    new_count: int
    departed_count: int
    account_change_count: int
    unchanged_count: int


@dataclass
class ComparisonResult:
    """Result of comparing two months of employee data."""
    new_employees: List[Dict]  # Status Masuk
    departed_employees: List[Dict]  # Status Keluar
    account_changes: List[Dict]  # Status Rekening Berbeda
    unchanged_employees: List[Dict]
    summary: ComparisonSummary


class EmployeeComparator:
    """
    Service for comparing employee data between two months.
    Identifies new employees, departed employees, and account changes.
    """
    
    @staticmethod
    def identify_new_employees(current: List[Pegawai], previous: List[Pegawai]) -> List[Pegawai]:
        """
        Identify employees present in current month but not in previous month.
        These are new employees (Status Masuk).
        
        Args:
            current: List of employees in current month
            previous: List of employees in previous month
            
        Returns:
            List[Pegawai]: List of new employees
        """
        # Create set of NIPs from previous month
        previous_nips = {emp.nip for emp in previous}
        
        # Find employees in current but not in previous
        new_employees = [emp for emp in current if emp.nip not in previous_nips]
        
        return new_employees
    
    @staticmethod
    def identify_departed_employees(current: List[Pegawai], previous: List[Pegawai]) -> List[Pegawai]:
        """
        Identify employees present in previous month but not in current month.
        These are departed employees (Status Keluar).
        
        Args:
            current: List of employees in current month
            previous: List of employees in previous month
            
        Returns:
            List[Pegawai]: List of departed employees
        """
        # Create set of NIPs from current month
        current_nips = {emp.nip for emp in current}
        
        # Find employees in previous but not in current
        departed_employees = [emp for emp in previous if emp.nip not in current_nips]
        
        return departed_employees
    
    @staticmethod
    def identify_account_changes(current: List[Pegawai], previous: List[Pegawai]) -> List[tuple]:
        """
        Identify employees with different nomor_rekening between months.
        These are employees with account changes (Status Rekening Berbeda).
        
        Args:
            current: List of employees in current month
            previous: List of employees in previous month
            
        Returns:
            List[tuple]: List of tuples (current_employee, old_account_number)
        """
        # Create dictionary of NIP -> nomor_rekening for previous month
        previous_accounts = {emp.nip: emp.nomor_rekening for emp in previous}
        
        # Find employees with different account numbers
        account_changes = []
        for emp in current:
            if emp.nip in previous_accounts:
                old_account = previous_accounts[emp.nip]
                if emp.nomor_rekening != old_account:
                    account_changes.append((emp, old_account))
        
        return account_changes
    
    @staticmethod
    def identify_unchanged_employees(current: List[Pegawai], previous: List[Pegawai]) -> List[Pegawai]:
        """
        Identify employees present in both months with identical data.
        
        Args:
            current: List of employees in current month
            previous: List of employees in previous month
            
        Returns:
            List[Pegawai]: List of unchanged employees
        """
        # Create dictionary of NIP -> nomor_rekening for previous month
        previous_accounts = {emp.nip: emp.nomor_rekening for emp in previous}
        
        # Find employees with same account numbers
        unchanged = []
        for emp in current:
            if emp.nip in previous_accounts:
                old_account = previous_accounts[emp.nip]
                if emp.nomor_rekening == old_account:
                    unchanged.append(emp)
        
        return unchanged
    
    @staticmethod
    def compare_months(current: List[Pegawai], previous: List[Pegawai]) -> ComparisonResult:
        """
        Compare two months of employee data and categorize all employees.
        
        Args:
            current: List of employees in current month
            previous: List of employees in previous month
            
        Returns:
            ComparisonResult: Comprehensive comparison results with summary
        """
        # Handle edge case: no comparison data
        if not previous:
            # All current employees are "new"
            new_employees = current
            departed_employees = []
            account_changes = []
            unchanged_employees = []
        else:
            # Identify all categories
            new_employees = EmployeeComparator.identify_new_employees(current, previous)
            departed_employees = EmployeeComparator.identify_departed_employees(current, previous)
            account_changes = EmployeeComparator.identify_account_changes(current, previous)
            unchanged_employees = EmployeeComparator.identify_unchanged_employees(current, previous)
        
        # Convert to dictionaries for API response
        new_employees_dict = []
        for emp in new_employees:
            emp_dict = emp.to_dict()
            emp_dict['status'] = 'Masuk'
            new_employees_dict.append(emp_dict)
        
        departed_employees_dict = []
        for emp in departed_employees:
            emp_dict = emp.to_dict()
            emp_dict['status'] = 'Keluar'
            departed_employees_dict.append(emp_dict)
        
        account_changes_dict = []
        for emp, old_account in account_changes:
            emp_dict = emp.to_dict()
            emp_dict['status'] = 'Rekening Berbeda'
            emp_dict['nomor_rekening_lama'] = old_account
            account_changes_dict.append(emp_dict)
        
        unchanged_employees_dict = []
        for emp in unchanged_employees:
            emp_dict = emp.to_dict()
            emp_dict['status'] = 'Aktif'
            unchanged_employees_dict.append(emp_dict)
        
        # Create summary
        summary = ComparisonSummary(
            total_current=len(current),
            total_previous=len(previous),
            new_count=len(new_employees),
            departed_count=len(departed_employees),
            account_change_count=len(account_changes),
            unchanged_count=len(unchanged_employees)
        )
        
        # Return comparison result
        return ComparisonResult(
            new_employees=new_employees_dict,
            departed_employees=departed_employees_dict,
            account_changes=account_changes_dict,
            unchanged_employees=unchanged_employees_dict,
            summary=summary
        )
