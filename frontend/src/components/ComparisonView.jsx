import React, { useState } from "react";
import { getComparison } from "../api/api";
import DataTable from "./DataTable";
import "./ComparisonView.css";

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

function ComparisonView({ hasPermission, currentUser }) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedUnit, setSelectedUnit] = useState("Dinas");
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompare = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getComparison(
        selectedMonth,
        selectedYear,
        selectedUnit
      );

      // Data sudah di-compare di backend, langsung tampilkan
      setComparisonData(result.results);

      // Build detailed notification message
      const changes = [];
      if (result.summary.new_count > 0)
        changes.push(`${result.summary.new_count} masuk`);
      if (result.summary.departed_count > 0)
        changes.push(`${result.summary.departed_count} keluar`);
      if (result.summary.account_change_count > 0)
        changes.push(`${result.summary.account_change_count} rekening berbeda`);

      const totalChanges =
        result.summary.new_count +
        result.summary.departed_count +
        result.summary.account_change_count;
      const message =
        changes.length > 0
          ? `Perbandingan selesai! ${changes.join(
              ", "
            )}. Total ${totalChanges} perubahan.`
          : "Perbandingan selesai! Tidak ada perubahan.";

      // Show notification
      window.dispatchEvent(
        new CustomEvent("showNotification", {
          detail: {
            message: message,
            type: "success",
          },
        })
      );
    } catch (err) {
      setError(err.message || "Gagal melakukan perbandingan");
      window.dispatchEvent(
        new CustomEvent("showNotification", {
          detail: {
            message: err.message || "Gagal melakukan perbandingan",
            type: "error",
          },
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comparison-view">
      <header className="content-header">
        <h1>Hasil Perbandingan Data Pegawai</h1>
        <p className="subtitle">
          Bandingkan data pegawai bulan ini dengan bulan sebelumnya
        </p>
      </header>

      <div className="comparison-controls">
        <div className="control-group">
          <label htmlFor="unit">Unit Kerja</label>
          <select
            id="unit"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            {VALID_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="month">Bulan</label>
          <select
            id="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString("id-ID", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="year">Tahun</label>
          <select
            id="year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {[2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <button
          className="compare-button"
          onClick={handleCompare}
          disabled={loading}
        >
          {loading ? "Membandingkan..." : "🔍 Bandingkan Data"}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {comparisonData && (
        <div className="comparison-info">
          <p>
            Menampilkan perbandingan data{" "}
            <strong>
              {selectedUnit} -{" "}
              {new Date(selectedYear, selectedMonth - 1, 1).toLocaleString(
                "id-ID",
                { month: "long" }
              )}{" "}
              {selectedYear}
            </strong>{" "}
            dengan bulan sebelumnya
          </p>
        </div>
      )}

      <DataTable
        data={comparisonData}
        loading={loading}
        month={selectedMonth}
        year={selectedYear}
        unit={selectedUnit}
        isArchive={false}
        canEditStatus={hasPermission && hasPermission("edit_status")}
        currentUser={currentUser}
      />
    </div>
  );
}

export default ComparisonView;
