from sqlalchemy import Column, Integer, String, Date, DateTime, Index, UniqueConstraint
from sqlalchemy.sql import func
from datetime import datetime
from app.database import Base


class Pegawai(Base):
    """
    Model for employee data (Pegawai).
    Stores employee information with monthly snapshots for comparison.
    """
    __tablename__ = "pegawai"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Employee identification fields
    nip = Column(String(20), nullable=False, index=True)
    nama = Column(String(255), nullable=False)
    nik = Column(String(20), nullable=False)
    npwp = Column(String(30), nullable=False)
    tgl_lahir = Column(Date, nullable=False)
    
    # Bank information
    kode_bank = Column(String(3), nullable=False)
    nama_bank = Column(String(50), nullable=False)
    nomor_rekening = Column(String(20), nullable=False)
    
    # Status field for comparison results
    # Possible values: 'Aktif', 'Masuk', 'Keluar', 'Pindah', 'Pensiun', 'Rekening Berbeda'
    status = Column(String(30), default='Aktif', nullable=False, index=True)
    
    # Manual override flag - if True, status was manually changed and should not be overwritten by comparison
    manual_override = Column(Integer, default=0, nullable=False)
    
    # Unit kerja field
    # Possible values: 'Dinas', 'Cabdis Wil. 1', 'Cabdis Wil. 2', 'Cabdis Wil. 3', 
    #                  'Cabdis Wil. 4', 'Cabdis Wil. 5', 'Cabdis Wil. 6', 'PPPK'
    unit = Column(String(20), nullable=False, index=True)
    
    # Month and year for tracking historical data
    month = Column(Integer, nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    
    # Audit timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    # Table constraints and indexes
    __table_args__ = (
        # Unique constraint: one employee per month/year/unit combination
        UniqueConstraint('nip', 'month', 'year', 'unit', name='uq_nip_month_year_unit'),
        
        # Composite index for efficient month/year/unit queries
        Index('idx_month_year_unit', 'month', 'year', 'unit'),
        
        # Individual indexes already defined in Column definitions:
        # - idx_pegawai_nip (on nip)
        # - idx_pegawai_status (on status)
        # - idx_pegawai_unit (on unit)
    )
    
    def __repr__(self):
        return f"<Pegawai(nip={self.nip}, nama={self.nama}, unit={self.unit}, month={self.month}, year={self.year}, status={self.status})>"
    
    def to_dict(self):
        """
        Convert model instance to dictionary.
        Useful for API responses.
        """
        return {
            'id': self.id,
            'nip': self.nip,
            'nama': self.nama,
            'nik': self.nik,
            'npwp': self.npwp,
            'tgl_lahir': self.tgl_lahir.isoformat() if self.tgl_lahir else None,
            'kode_bank': self.kode_bank,
            'nama_bank': self.nama_bank,
            'nomor_rekening': self.nomor_rekening,
            'status': self.status,
            'manual_override': self.manual_override,
            'unit': self.unit,
            'month': self.month,
            'year': self.year,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
