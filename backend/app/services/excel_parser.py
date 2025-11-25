import pandas as pd
from fastapi import UploadFile
from typing import List, Dict
import io


class ExcelParser:
    """
    Service for parsing Excel files containing employee data.
    Supports both .xlsx and .csv formats.
    """
    
    # Required columns that must be present in the Excel file
    REQUIRED_COLUMNS = [
        'NIP',
        'Nama',
        'NIK',
        'NPWP',
        'Tanggal Lahir',
        'Kode Bank',
        'Nama Bank',
        'Nomor Rekening'
    ]
    
    @staticmethod
    async def parse_file(file: UploadFile) -> pd.DataFrame:
        """
        Parse Excel or CSV file and return DataFrame.
        
        Args:
            file: UploadFile object from FastAPI
            
        Returns:
            pd.DataFrame: Parsed data
            
        Raises:
            ValueError: If file format is not supported or parsing fails
        """
        try:
            # Read file content
            content = await file.read()
            
            # Determine file type and parse accordingly
            if file.filename.endswith('.xlsx'):
                df = pd.read_excel(io.BytesIO(content), engine='openpyxl')
            elif file.filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(content))
            else:
                raise ValueError(f"Unsupported file format: {file.filename}. Only .xlsx and .csv are supported.")
            
            return df
            
        except Exception as e:
            raise ValueError(f"Failed to parse file: {str(e)}")
    
    @staticmethod
    def validate_columns(df: pd.DataFrame) -> bool:
        """
        Validate that all required columns are present in the DataFrame.
        
        Args:
            df: DataFrame to validate
            
        Returns:
            bool: True if all required columns are present
            
        Raises:
            ValueError: If required columns are missing
        """
        # Get actual columns from DataFrame
        actual_columns = set(df.columns)
        required_columns = set(ExcelParser.REQUIRED_COLUMNS)
        
        # Check for missing columns
        missing_columns = required_columns - actual_columns
        
        if missing_columns:
            raise ValueError(
                f"Missing required columns: {', '.join(missing_columns)}. "
                f"Required columns are: {', '.join(ExcelParser.REQUIRED_COLUMNS)}"
            )
        
        return True
    
    @staticmethod
    def to_dict_list(df: pd.DataFrame) -> List[Dict]:
        """
        Convert DataFrame to list of dictionaries.
        
        Args:
            df: DataFrame to convert
            
        Returns:
            List[Dict]: List of employee records as dictionaries
        """
        # Replace NaN values with None
        df = df.where(pd.notna(df), None)
        
        # Convert to list of dictionaries
        records = df.to_dict('records')
        
        return records
    
    @staticmethod
    async def parse_and_validate(file: UploadFile) -> List[Dict]:
        """
        Parse Excel file and validate columns in one step.
        
        Args:
            file: UploadFile object from FastAPI
            
        Returns:
            List[Dict]: List of employee records as dictionaries
            
        Raises:
            ValueError: If parsing or validation fails
        """
        # Parse file
        df = await ExcelParser.parse_file(file)
        
        # Validate columns
        ExcelParser.validate_columns(df)
        
        # Convert to list of dictionaries
        records = ExcelParser.to_dict_list(df)
        
        return records
