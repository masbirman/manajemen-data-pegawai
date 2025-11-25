import React, { useState, useEffect, useCallback } from "react";
import DataTable from "./DataTable";
import { getArchiveData, getAvailableMonths } from "../api/api";
import "./ArchiveViewer.css";

const VALID_UNITS = [
  "Dinas",
  "Cabdis Wil. 1",
  "Cabdis Wil. 2",
  "Cabdis Wil. 3",
  "Cabdis Wil. 4",
  "Cabdis Wil. 5",
  "Cabdis Wil. 6",
  "PPPK",
];

function ArchiveViewer({ hasPermission }) {
  const [archiveData, setArchiveData] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadAvailableMonths = async () => {
    try {
      const result = await getAvailableMonths();
      setAvailableMonths(result.months || []);
    } catch (err) {
      setError("Failed to load available months");
    }
  };

  const handleSearch = useCallback(
    async (autoSearch = false) => {
      setLoading(true);
      setError(null);

      try {
        const month = selectedMonth ? parseInt(selectedMonth) : null;
        const year = selectedYear ? parseInt(selectedYear) : null;
        const unit = selectedUnit || null;
        // Only include search term if not auto-search
        const search = autoSearch ? null : searchTerm.trim() || null;

        const result = await getArchiveData(month, year, unit, search);
        setArchiveData(result.data);

        if (result.data.length === 0) {
          setError("Tidak ada data yang sesuai dengan filter");
        }
      } catch (err) {
        setError(err.message || "Failed to load archive data");
        setArchiveData(null);
      } finally {
        setLoading(false);
      }
    },
    [selectedMonth, selectedYear, selectedUnit, searchTerm]
  );

  useEffect(() => {
    loadAvailableMonths();
  }, []);

  // Auto-search when filters change (but not search term - that needs manual trigger)
  useEffect(() => {
    if (selectedMonth || selectedYear || selectedUnit) {
      handleSearch(true); // true = auto-search, don't include searchTerm
    }
  }, [selectedMonth, selectedYear, selectedUnit, handleSearch]);

  const handleReset = () => {
    setSelectedMonth("");
    setSelectedYear("");
    setSelectedUnit("");
    setSearchTerm("");
    setArchiveData(null);
    setError(null);
  };

  const getUniqueYears = () => {
    const years = [...new Set(availableMonths.map((m) => m.year))];
    return years.sort((a, b) => b - a);
  };

  return (
    <div className="archive-viewer-container">
      <div className="archive-panel">
        <h3>Arsip Data Pegawai</h3>

        <div className="archive-filters">
          <div className="filter-group">
            <label>Unit:</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
            >
              <option value="">Semua Unit</option>
              {VALID_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Bulan:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">Semua Bulan</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleString("id-ID", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Tahun:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">Semua Tahun</option>
              {getUniqueYears().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group search-group">
            <label>Cari (NIP/Nama):</label>
            <input
              type="text"
              placeholder="Ketik NIP atau Nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>

          <div className="filter-actions">
            <button
              className="search-button"
              onClick={handleSearch}
              disabled={loading}
            >
              🔍 Cari
            </button>
            <button
              className="reset-button"
              onClick={handleReset}
              disabled={loading}
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {error && !archiveData && <div className="archive-error">{error}</div>}

        {archiveData && (
          <div className="archive-results">
            <div className="results-info">
              <p>
                Menampilkan <strong>{archiveData.length}</strong> records
                {selectedUnit && ` untuk ${selectedUnit}`}
                {selectedMonth &&
                  ` ${new Date(2000, selectedMonth - 1, 1).toLocaleString(
                    "id-ID",
                    { month: "long" }
                  )}`}
                {selectedYear && ` ${selectedYear}`}
                {searchTerm && ` dengan pencarian "${searchTerm}"`}
              </p>
            </div>
            <DataTable
              data={archiveData}
              loading={loading}
              month={selectedMonth ? parseInt(selectedMonth) : null}
              year={selectedYear ? parseInt(selectedYear) : null}
              unit={selectedUnit || null}
              isArchive={true}
              canEditStatus={hasPermission && hasPermission("edit_status")}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ArchiveViewer;
