import React, { useState, useEffect } from "react";
import { getAvailableMonths, getArchiveData } from "../api/api";
import { 
  PeopleAlt as PeopleIcon, 
  Business as BusinessIcon, 
  Edit as EditIcon,
  Refresh as RefreshIcon,
  AddCircleOutline as AddIcon,
  RemoveCircleOutline as RemoveIcon,
  SwapHoriz as TransferIcon,
  Elderly as RetireIcon,
  AccountBalanceWallet as WalletIcon,
  CalendarMonth as CalendarIcon,
  FilterAlt as FilterIcon
} from "@mui/icons-material";
import "./Dashboard.css";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    loadAvailableMonths();

    // Listen for status update events from DataTable
    const handleStatusUpdate = async () => {
      if (selectedMonth && selectedYear) {
        console.log("Status updated, auto-refreshing dashboard...");
        setAutoRefreshing(true);
        await loadDashboardData(selectedMonth, selectedYear, false);
        setTimeout(() => setAutoRefreshing(false), 1000);
      }
    };

    window.addEventListener("statusUpdated", handleStatusUpdate);

    return () => {
      window.removeEventListener("statusUpdated", handleStatusUpdate);
    };
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      loadDashboardData(selectedMonth, selectedYear);
    }
  }, [selectedMonth, selectedYear]);

  // Update available months for selected year
  const getMonthsForYear = (year) => {
    if (!year || availableMonths.length === 0) return [];
    return [
      ...new Map(
        availableMonths.filter((m) => m.year === year).map((m) => [m.month, m])
      ).values(),
    ].sort((a, b) => b.month - a.month);
  };

  // Handle year change
  const handleYearChange = (newYear) => {
    const monthsForYear = getMonthsForYear(newYear);

    if (monthsForYear.length > 0) {
      // Check if current month exists in new year
      const monthExists = monthsForYear.some((m) => m.month === selectedMonth);

      if (monthExists) {
        // Keep the same month if it exists in new year
        setSelectedYear(newYear);
      } else {
        // Set to latest month in new year if current month doesn't exist
        setSelectedYear(newYear);
        setSelectedMonth(monthsForYear[0].month);
      }
    }
  };

  const loadAvailableMonths = async () => {
    try {
      const result = await getAvailableMonths();
      const months = result.months || [];
      setAvailableMonths(months);

      // Auto-select latest month only on initial load
      if (months.length > 0 && isInitialLoad) {
        const latest = months[0];
        setSelectedMonth(latest.month);
        setSelectedYear(latest.year);
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error("Error loading available months:", error);
    }
  };

  const loadDashboardData = async (month, year, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // Get data for selected month
      const archiveResult = await getArchiveData(month, year, null, null);
      const data = archiveResult.data || [];

      // Calculate statistics per unit
      const unitBreakdown = {};
      let totalManualOverride = 0;

      data.forEach((emp) => {
        const unit = emp.unit;

        // Initialize unit if not exists
        if (!unitBreakdown[unit]) {
          unitBreakdown[unit] = {
            masuk: 0,
            keluar: 0,
            pindah: 0,
            pensiun: 0,
            aktif: 0,
            rekeningBerbeda: 0,
            totalUpload: 0,  // Total records uploaded
            totalPegawai: 0, // Calculated: totalUpload - pensiun - keluar - pindah + masuk
          };
        }

        // Count by status per unit
        switch (emp.status) {
          case "Masuk":
            unitBreakdown[unit].masuk++;
            break;
          case "Keluar":
            unitBreakdown[unit].keluar++;
            break;
          case "Pindah":
            unitBreakdown[unit].pindah++;
            break;
          case "Pensiun":
            unitBreakdown[unit].pensiun++;
            break;
          case "Rekening Berbeda":
            unitBreakdown[unit].rekeningBerbeda++;
            break;
          default:
            unitBreakdown[unit].aktif++;
        }

        unitBreakdown[unit].totalUpload++;

        // Count manual overrides
        if (emp.manual_override === 1) {
          totalManualOverride++;
        }
      });

      // Calculate Total Pegawai Aktif for each unit
      // Formula: totalUpload - pensiun - keluar - pindah
      // Note: "Masuk" employees are already included in totalUpload, so we don't add them again
      Object.keys(unitBreakdown).forEach((unit) => {
        const u = unitBreakdown[unit];
        u.totalPegawai = u.totalUpload - u.pensiun - u.keluar - u.pindah;
      });

      // Calculate totals across all units
      const totals = {
        masuk: 0,
        keluar: 0,
        pindah: 0,
        pensiun: 0,
        aktif: 0,
        rekeningBerbeda: 0,
        totalUpload: data.length,
        totalPegawai: 0,
      };

      Object.values(unitBreakdown).forEach((unit) => {
        totals.masuk += unit.masuk;
        totals.keluar += unit.keluar;
        totals.pindah += unit.pindah;
        totals.pensiun += unit.pensiun;
        totals.aktif += unit.aktif;
        totals.rekeningBerbeda += unit.rekeningBerbeda;
        totals.totalPegawai += unit.totalPegawai;
      });

      setStats({
        totalRecords: data.length,
        totalUnits: Object.keys(unitBreakdown).length,
        totalManualOverride,
        unitBreakdown,
        totals,
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (selectedMonth && selectedYear) {
      setLoading(true);
      // Force clear any cache by adding timestamp
      try {
        await loadDashboardData(selectedMonth, selectedYear, true);
        window.dispatchEvent(
          new CustomEvent("showNotification", {
            detail: {
              message: "Dashboard berhasil di-refresh!",
              type: "success",
            },
          })
        );
      } catch (error) {
        console.error("Error refreshing dashboard:", error);
        window.dispatchEvent(
          new CustomEvent("showNotification", {
            detail: {
              message: "Gagal refresh dashboard",
              type: "error",
            },
          })
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2>Dashboard Overview</h2>
          <p>Ringkasan data pegawai dan statistik bulanan</p>
        </div>
        <div className="header-actions">
           {/* Placeholder for potential future actions */}
        </div>
      </div>

      {/* Month/Year Filter */}
      <div className="dashboard-filters">
        <div className="filter-group">
          <label htmlFor="dashboard-month"><CalendarIcon fontSize="small"/> Bulan</label>
          <div className="select-wrapper">
            <select
              id="dashboard-month"
              value={selectedMonth || ""}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {getMonthsForYear(selectedYear).map((m, idx) => (
                <option key={idx} value={m.month}>
                  {new Date(2000, m.month - 1).toLocaleString("id-ID", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="dashboard-year"><FilterIcon fontSize="small"/> Tahun</label>
          <div className="select-wrapper">
            <select
              id="dashboard-year"
              value={selectedYear || ""}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
            >
              {[...new Set(availableMonths.map((m) => m.year))]
                .sort((a, b) => b - a)
                .map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="filter-info">
          <span className="info-badge">
            Menampilkan data:{" "}
            <strong>
              {selectedMonth &&
                new Date(2000, selectedMonth - 1).toLocaleString("id-ID", {
                  month: "long",
                })}{" "}
              {selectedYear}
            </strong>
          </span>
        </div>

        <button
          className="refresh-button"
          onClick={handleRefresh}
          title="Refresh data"
          disabled={autoRefreshing}
        >
          <RefreshIcon className={autoRefreshing ? "spin" : ""} fontSize="small" />
          {autoRefreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="summary-cards">
          <div className="summary-card primary">
            <div className="card-icon-wrapper">
              <PeopleIcon fontSize="large" />
            </div>
            <div className="card-content">
              <h4>{stats.totals?.totalPegawai || 0}</h4>
              <p>Total Pegawai Aktif</p>
            </div>
          </div>
          <div className="summary-card secondary">
            <div className="card-icon-wrapper">
              <BusinessIcon fontSize="large" />
            </div>
            <div className="card-content">
              <h4>{stats.totalUnits}</h4>
              <p>Total Unit Kerja</p>
            </div>
          </div>
          <div className="summary-card warning">
            <div className="card-icon-wrapper">
              <EditIcon fontSize="large" />
            </div>
            <div className="card-content">
              <h4>{stats.totalManualOverride}</h4>
              <p>Manual Override</p>
            </div>
          </div>
        </div>
      )}

      {/* Unit Status Breakdown Table */}
      {stats?.unitBreakdown && Object.keys(stats.unitBreakdown).length > 0 && (
        <div className="unit-status-breakdown">
          <div className="section-header">
            <h3>Breakdown Status per Unit</h3>
            <span className="period-badge">
              {selectedMonth &&
                new Date(2000, selectedMonth - 1).toLocaleString("id-ID", {
                  month: "long",
                })}{" "}
              {selectedYear}
            </span>
          </div>
          
          <div className="table-wrapper">
            <table className="status-table">
              <thead>
                <tr>
                  <th className="unit-col">Unit Kerja</th>
                  <th className="status-col">
                    <div className="th-content"><AddIcon fontSize="small"/> Masuk</div>
                  </th>
                  <th className="status-col">
                    <div className="th-content"><RemoveIcon fontSize="small"/> Keluar</div>
                  </th>
                  <th className="status-col">
                    <div className="th-content"><TransferIcon fontSize="small"/> Pindah</div>
                  </th>
                  <th className="status-col">
                    <div className="th-content"><RetireIcon fontSize="small"/> Pensiun</div>
                  </th>
                  <th className="status-col">
                    <div className="th-content"><WalletIcon fontSize="small"/> Rek. Beda</div>
                  </th>
                  <th className="total-col">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.unitBreakdown)
                  .sort((a, b) => {
                    // Define unit order
                    const unitOrder = [
                      "Dinas",
                      "Cabdis Wil. 1",
                      "Cabdis Wil. 2",
                      "Cabdis Wil. 3",
                      "Cabdis Wil. 4",
                      "Cabdis Wil. 5",
                      "Cabdis Wil. 6",
                      "PPPK",
                    ];
                    const indexA = unitOrder.indexOf(a[0]);
                    const indexB = unitOrder.indexOf(b[0]);
                    // If unit not in order list, put at end
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                  })
                  .map(([unit, breakdown], idx) => (
                    <tr key={idx}>
                      <td className="unit-name">{unit}</td>
                      <td>
                        {breakdown.masuk > 0 ? (
                          <span className="status-badge masuk">{breakdown.masuk}</span>
                        ) : (
                          <span className="empty-dash">-</span>
                        )}
                      </td>
                      <td>
                        {breakdown.keluar > 0 ? (
                          <span className="status-badge keluar">{breakdown.keluar}</span>
                        ) : (
                          <span className="empty-dash">-</span>
                        )}
                      </td>
                      <td>
                        {breakdown.pindah > 0 ? (
                          <span className="status-badge pindah">{breakdown.pindah}</span>
                        ) : (
                          <span className="empty-dash">-</span>
                        )}
                      </td>
                      <td>
                        {breakdown.pensiun > 0 ? (
                          <span className="status-badge pensiun">{breakdown.pensiun}</span>
                        ) : (
                          <span className="empty-dash">-</span>
                        )}
                      </td>
                      <td>
                        {breakdown.rekeningBerbeda > 0 ? (
                          <span className="status-badge rekening">{breakdown.rekeningBerbeda}</span>
                        ) : (
                          <span className="empty-dash">-</span>
                        )}
                      </td>
                      <td className="total-value">
                        <strong>{breakdown.totalPegawai}</strong>
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="totals-row">
                  <td className="unit-name">
                    <strong>TOTAL KESELURUHAN</strong>
                  </td>
                  <td>
                    <span className="status-badge masuk total">{stats.totals.masuk}</span>
                  </td>
                  <td>
                    <span className="status-badge keluar total">{stats.totals.keluar}</span>
                  </td>
                  <td>
                    <span className="status-badge pindah total">{stats.totals.pindah}</span>
                  </td>
                  <td>
                    <span className="status-badge pensiun total">{stats.totals.pensiun}</span>
                  </td>
                  <td>
                    <span className="status-badge rekening total">{stats.totals.rekeningBerbeda}</span>
                  </td>
                  <td className="total-value">
                    <strong>{stats.totals.totalPegawai}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
