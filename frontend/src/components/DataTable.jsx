import React, { useMemo, useState, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { updateEmployeeStatus, updateDepartedEmployeeStatus } from "../api/api";
import * as XLSX from "xlsx";
import "./DataTable.css";

const VALID_STATUSES = [
  "Aktif",
  "Masuk",
  "Keluar",
  "Pindah",
  "Pensiun",
  "Rekening Berbeda",
];

const VALID_UNITS = [
  "Semua",
  "Dinas",
  "Cabdis Wil. 1",
  "Cabdis Wil. 2",
  "Cabdis Wil. 3",
  "Cabdis Wil. 4",
  "Cabdis Wil. 5",
  "Cabdis Wil. 6",
  "PPPK",
];

function DataTable({
  data,
  loading,
  month,
  year,
  unit,
  isArchive = false,
  onDataUpdate,
  canEditStatus = true,
  currentUser = null,
}) {
  // Check if user is superadmin
  const isSuperAdmin = currentUser?.role === "superadmin";

  // Function to mask sensitive data (show first 4 chars + asterisks)
  const maskSensitiveData = (value) => {
    if (!value || isSuperAdmin) return value;
    const str = String(value);
    if (str.length <= 4) return str;
    return str.substring(0, 4) + "*".repeat(Math.min(str.length - 4, 10));
  };

  // Function to mask date (show year only)
  const maskDate = (value) => {
    if (!value || isSuperAdmin) return value;
    const str = String(value);
    // Format: YYYY-MM-DD or DD-MM-YYYY
    if (str.includes("-")) {
      const parts = str.split("-");
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return parts[0] + "-**-**";
      } else {
        // DD-MM-YYYY
        return "**-**-" + parts[2];
      }
    }
    return str.substring(0, 4) + "****";
  };
  const [searchText, setSearchText] = useState("");
  const defaultUnit = localStorage.getItem("defaultUnit") || "Dinas";
  const [activeUnit, setActiveUnit] = useState(unit || defaultUnit);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updateMessage, setUpdateMessage] = useState(null);
  const gridRef = useRef();

  // Refs to hold latest values for use in cell editor (to avoid stale closure)
  const selectedMonthRef = useRef(month);
  const selectedYearRef = useRef(year);
  const activeUnitRef = useRef(unit || defaultUnit);

  // Get items per page from localStorage
  const itemsPerPageSetting = localStorage.getItem("itemsPerPage") || "100";
  const paginationPageSize =
    itemsPerPageSetting === "all" ? 10000 : parseInt(itemsPerPageSetting);

  // Update active unit when unit prop changes
  useEffect(() => {
    if (unit) {
      setActiveUnit(unit);
    }
  }, [unit]);

  // Update selected month/year when props change
  useEffect(() => {
    setSelectedMonth(month);
    setSelectedYear(year);
    selectedMonthRef.current = month;
    selectedYearRef.current = year;
  }, [month, year]);

  // Update activeUnit ref when it changes
  useEffect(() => {
    activeUnitRef.current = unit;
  }, [unit]);

  // Get available years from data
  const getAvailableYears = () => {
    if (!data || data.length === 0) return [];
    const years = [...new Set(data.map((row) => row.year))];
    return years.sort((a, b) => b - a);
  };
  // Status cell editor
  const StatusCellEditor = (params) => {
    const [value, setValue] = useState(params.value);

    const handleChange = async (e) => {
      const newStatus = e.target.value;
      setValue(newStatus);

      try {
        // Use refs to get latest values (avoid stale closure)
        const currentMonth = selectedMonthRef.current || params.data.month;
        const currentYear = selectedYearRef.current || params.data.year;
        const currentUnit = activeUnitRef.current || params.data.unit;

        // Check if this is a departed employee (from previous month)
        const isDepartedEmployee =
          params.data.month !== currentMonth ||
          params.data.year !== currentYear;

        console.log("Status Update Debug:", {
          isDepartedEmployee,
          employeeMonth: params.data.month,
          employeeYear: params.data.year,
          currentMonth,
          currentYear,
          currentUnit,
          nip: params.data.nip,
          newStatus,
        });

        if (isDepartedEmployee) {
          // For departed employees, create new record in current month
          console.log("Calling updateDepartedEmployeeStatus with:", {
            nip: params.data.nip,
            month: currentMonth,
            year: currentYear,
            unit: currentUnit,
            status: newStatus,
          });

          await updateDepartedEmployeeStatus(
            params.data.nip,
            currentMonth,
            currentYear,
            currentUnit,
            newStatus
          );
        } else {
          // For existing employees, update their record
          console.log("Calling updateEmployeeStatus with:", {
            id: params.data.id,
            status: newStatus,
          });

          await updateEmployeeStatus(params.data.id, newStatus);
        }

        params.api.stopEditing();

        // Update local data
        params.data.status = newStatus;
        params.data.manual_override = 1;
        if (isDepartedEmployee) {
          // Update month/year to current month since we created new record
          params.data.month = currentMonth;
          params.data.year = currentYear;
        }
        params.api.refreshCells({ rowNodes: [params.node], force: true });

        const monthInfo = isDepartedEmployee
          ? ` (tersimpan di ${currentMonth}/${currentYear})`
          : "";

        setUpdateMessage({
          type: "success",
          text: `Status berhasil diubah menjadi "${newStatus}"${monthInfo} dan tersimpan ke database`,
        });

        // Show global notification
        window.dispatchEvent(
          new CustomEvent("showNotification", {
            detail: {
              message: `Status pegawai berhasil diubah menjadi "${newStatus}"${monthInfo}. Dashboard akan otomatis ter-update.`,
              type: "success",
            },
          })
        );

        // Trigger dashboard auto-refresh
        window.dispatchEvent(new CustomEvent("statusUpdated"));

        // Notify parent to refresh data
        if (onDataUpdate) {
          onDataUpdate();
        }

        setTimeout(() => setUpdateMessage(null), 5000);
      } catch (error) {
        setUpdateMessage({
          type: "error",
          text: error.message || "Gagal mengubah status",
        });
        setTimeout(() => setUpdateMessage(null), 3000);
      }
    };

    return (
      <select
        value={value}
        onChange={handleChange}
        style={{
          width: "100%",
          height: "100%",
          border: "2px solid #2563eb",
          padding: "4px",
          fontSize: "0.9rem",
        }}
        autoFocus
      >
        {VALID_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    );
  };

  // Column definitions
  const columnDefs = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => [
      {
        headerName: "NIP",
        field: "nip",
        sortable: true,
        filter: true,
        width: 150,
        pinned: "left",
        valueFormatter: (params) => maskSensitiveData(params.value),
      },
      {
        headerName: "Nama",
        field: "nama",
        sortable: true,
        filter: true,
        width: 200,
      },
      {
        headerName: "NIK",
        field: "nik",
        sortable: true,
        filter: true,
        width: 180,
        valueFormatter: (params) => maskSensitiveData(params.value),
      },
      {
        headerName: "NPWP",
        field: "npwp",
        sortable: true,
        filter: true,
        width: 180,
        valueFormatter: (params) => maskSensitiveData(params.value),
      },
      {
        headerName: "Tanggal Lahir",
        field: "tgl_lahir",
        sortable: true,
        filter: true,
        width: 150,
        valueFormatter: (params) => maskDate(params.value),
      },
      {
        headerName: "Kode Bank",
        field: "kode_bank",
        sortable: true,
        filter: true,
        width: 120,
      },
      {
        headerName: "Nama Bank",
        field: "nama_bank",
        sortable: true,
        filter: true,
        width: 150,
      },
      {
        headerName: "Nomor Rekening",
        field: "nomor_rekening",
        sortable: true,
        filter: true,
        width: 250,
        cellRenderer: (params) => {
          if (
            params.data.status === "Rekening Berbeda" &&
            params.data.nomor_rekening_lama
          ) {
            return (
              <div className="account-comparison">
                <div className="old-account">
                  <span className="label">Lama:</span>{" "}
                  {maskSensitiveData(params.data.nomor_rekening_lama)}
                </div>
                <div className="new-account">
                  <span className="label">Baru:</span>{" "}
                  {maskSensitiveData(params.value)}
                </div>
              </div>
            );
          }
          return maskSensitiveData(params.value);
        },
      },
      {
        headerName: "Status",
        field: "status",
        sortable: true,
        filter: true,
        width: 200,
        editable: canEditStatus,
        cellEditor: StatusCellEditor,
        cellRenderer: (params) => {
          const isManualOverride = params.data.manual_override === 1;
          const isDepartedEmployee =
            params.data.month !== selectedMonth ||
            params.data.year !== selectedYear;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>{params.value}</span>
              {isManualOverride && (
                <span
                  title="Status diubah manual"
                  style={{
                    fontSize: "0.75rem",
                    color: "#2563eb",
                    fontWeight: "bold",
                  }}
                >
                  ✏️
                </span>
              )}
              {isDepartedEmployee && (
                <span
                  title="Data dari bulan sebelumnya (akan tersimpan di bulan tersebut)"
                  style={{
                    fontSize: "0.75rem",
                    color: "#f59e0b",
                    fontWeight: "bold",
                  }}
                >
                  📅
                </span>
              )}
            </div>
          );
        },
        cellStyle: (params) => {
          const isDepartedEmployee =
            params.data.month !== selectedMonth ||
            params.data.year !== selectedYear;
          const baseStyle = {
            fontWeight: "bold",
            cursor: "pointer",
          };
          const isManualOverride = params.data.manual_override === 1;
          const borderStyle = isManualOverride
            ? { border: "2px solid #2563eb" }
            : isDepartedEmployee
            ? { border: "2px solid #f59e0b" }
            : {};

          switch (params.value) {
            case "Masuk":
              return {
                ...baseStyle,
                ...borderStyle,
                backgroundColor: "#d4edda",
                color: "#155724",
              };
            case "Keluar":
              return {
                ...baseStyle,
                ...borderStyle,
                backgroundColor: "#f8d7da",
                color: "#721c24",
              };
            case "Pindah":
              return {
                ...baseStyle,
                ...borderStyle,
                backgroundColor: "#e0e7ff",
                color: "#3730a3",
              };
            case "Pensiun":
              return {
                ...baseStyle,
                ...borderStyle,
                backgroundColor: "#fce7f3",
                color: "#831843",
              };
            case "Rekening Berbeda":
              return {
                ...baseStyle,
                ...borderStyle,
                backgroundColor: "#fff3cd",
                color: "#856404",
              };
            default:
              return { ...baseStyle, ...borderStyle };
          }
        },
      },
    ],
    [isSuperAdmin]
  );

  // Default column properties
  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  // Filter data by month, year, status, and active unit
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // For comparison view (not archive), show only CHANGES (not "Aktif")
    // because data already includes departed employees from previous month
    if (!isArchive) {
      return data.filter((row) => {
        // Only filter by unit and status
        const matchUnit = activeUnit === "Semua" || row.unit === activeUnit;
        const matchStatus = !selectedStatus || row.status === selectedStatus;

        // IMPORTANT: Only show changes, hide "Aktif" (unchanged) employees
        const hasChange = row.status !== "Aktif";

        return matchUnit && hasChange && matchStatus;
      });
    }

    // For archive view, filter by month/year/unit/status (show all including "Aktif")
    return data.filter((row) => {
      const matchMonth = !selectedMonth || row.month === selectedMonth;
      const matchYear = !selectedYear || row.year === selectedYear;
      const matchUnit = activeUnit === "Semua" || row.unit === activeUnit;
      const matchStatus = !selectedStatus || row.status === selectedStatus;

      return matchMonth && matchYear && matchUnit && matchStatus;
    });
  }, [
    data,
    selectedMonth,
    selectedYear,
    activeUnit,
    selectedStatus,
    isArchive,
  ]);

  // Row styling based on status
  const getRowStyle = (params) => {
    switch (params.data.status) {
      case "Masuk":
        return { backgroundColor: "#f0f8f0" };
      case "Keluar":
        return { backgroundColor: "#fef5f5" };
      case "Rekening Berbeda":
        return { backgroundColor: "#fffef0" };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="data-table-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="data-table-container">
        <div className="empty-state">
          <p>No data to display. Please upload a file and run comparison.</p>
        </div>
      </div>
    );
  }

  // Handle search
  const onSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.setQuickFilter(value);
    }
  };

  const clearSearch = () => {
    setSearchText("");
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.setQuickFilter("");
    }
  };

  // Helper function to convert data to Excel format
  const prepareExcelData = (dataRows) => {
    return dataRows.map((row) => ({
      NIP: row.nip || "",
      Nama: row.nama || "",
      NIK: row.nik || "",
      NPWP: row.npwp || "",
      "Tanggal Lahir": row.tgl_lahir || "",
      "Kode Bank": row.kode_bank || "",
      "Nama Bank": row.nama_bank || "",
      "Nomor Rekening": row.nomor_rekening || "",
      "Nomor Rekening Lama": row.nomor_rekening_lama || "-",
      Status: row.status || "",
      Unit: row.unit || "",
      Bulan: row.month || "",
      Tahun: row.year || "",
    }));
  };

  // Helper function to create worksheet with styling
  const createStyledWorksheet = (dataRows) => {
    const excelData = prepareExcelData(dataRows);
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws["!cols"] = [
      { wch: 20 }, // NIP
      { wch: 35 }, // Nama
      { wch: 18 }, // NIK
      { wch: 18 }, // NPWP
      { wch: 12 }, // Tanggal Lahir
      { wch: 10 }, // Kode Bank
      { wch: 12 }, // Nama Bank
      { wch: 18 }, // Nomor Rekening
      { wch: 18 }, // Nomor Rekening Lama
      { wch: 15 }, // Status
      { wch: 15 }, // Unit
      { wch: 8 }, // Bulan
      { wch: 8 }, // Tahun
    ];

    return ws;
  };

  const handleDownloadExcel = () => {
    if (!filteredData || filteredData.length === 0) return;

    const monthName = selectedMonth
      ? getMonthName(selectedMonth).replace(/\s+/g, "_")
      : "Semua_Bulan";
    const yearName = selectedYear || "Semua_Tahun";

    // Check if "Semua" unit is selected - create multiple sheets
    if (activeUnit === "Semua") {
      const wb = XLSX.utils.book_new();

      // Group data by unit
      const unitGroups = {};
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

      // Initialize groups
      unitOrder.forEach((unit) => {
        unitGroups[unit] = [];
      });

      // Group filtered data by unit
      filteredData.forEach((row) => {
        if (unitGroups[row.unit]) {
          unitGroups[row.unit].push(row);
        }
      });

      // Create sheet for each unit that has data
      unitOrder.forEach((unit) => {
        if (unitGroups[unit] && unitGroups[unit].length > 0) {
          const ws = createStyledWorksheet(unitGroups[unit]);
          const sheetName = unit.replace(/\./g, "").substring(0, 31); // Excel sheet name max 31 chars
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
      });

      // Create summary sheet
      const summaryData = unitOrder
        .filter((unit) => unitGroups[unit] && unitGroups[unit].length > 0)
        .map((unit) => {
          const unitData = unitGroups[unit];
          return {
            Unit: unit,
            "Total Pegawai": unitData.length,
            Masuk: unitData.filter((r) => r.status === "Masuk").length,
            Keluar: unitData.filter((r) => r.status === "Keluar").length,
            Pindah: unitData.filter((r) => r.status === "Pindah").length,
            Pensiun: unitData.filter((r) => r.status === "Pensiun").length,
            Aktif: unitData.filter((r) => r.status === "Aktif").length,
            "Rekening Berbeda": unitData.filter(
              (r) => r.status === "Rekening Berbeda"
            ).length,
          };
        });

      // Add total row
      summaryData.push({
        Unit: "TOTAL",
        "Total Pegawai": filteredData.length,
        Masuk: filteredData.filter((r) => r.status === "Masuk").length,
        Keluar: filteredData.filter((r) => r.status === "Keluar").length,
        Pindah: filteredData.filter((r) => r.status === "Pindah").length,
        Pensiun: filteredData.filter((r) => r.status === "Pensiun").length,
        Aktif: filteredData.filter((r) => r.status === "Aktif").length,
        "Rekening Berbeda": filteredData.filter(
          (r) => r.status === "Rekening Berbeda"
        ).length,
      });

      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      summaryWs["!cols"] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, summaryWs, "Ringkasan");

      // Generate filename and download
      const filename = `Data_Pegawai_Semua_Unit_${monthName}_${yearName}.xlsx`;
      XLSX.writeFile(wb, filename);
    } else {
      // Single unit - create single sheet
      const wb = XLSX.utils.book_new();
      const ws = createStyledWorksheet(filteredData);
      const sheetName = activeUnit.replace(/\./g, "").substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const unitName = activeUnit.replace(/\s+/g, "_").replace(/\./g, "");
      const filename = `Data_Pegawai_${unitName}_${monthName}_${yearName}.xlsx`;
      XLSX.writeFile(wb, filename);
    }
  };

  // Get month name in Indonesian
  const getMonthName = (monthNum) => {
    if (!monthNum) return "";
    return new Date(2000, monthNum - 1, 1).toLocaleString("id-ID", {
      month: "long",
    });
  };

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h2>
          {isArchive ? "Arsip Data Pegawai" : "Hasil Perbandingan Data Pegawai"}
        </h2>
        {(selectedMonth || selectedYear) && (
          <p className="data-period-info">
            Menampilkan data: <strong>{activeUnit}</strong>
            {selectedMonth && selectedYear && (
              <>
                {" - "}
                <strong>
                  {getMonthName(selectedMonth)} {selectedYear}
                </strong>
              </>
            )}
            {selectedMonth && !selectedYear && (
              <>
                {" - "}
                <strong>{getMonthName(selectedMonth)}</strong>
              </>
            )}
            {!selectedMonth && selectedYear && (
              <>
                {" - "}
                <strong>{selectedYear}</strong>
              </>
            )}
          </p>
        )}
      </div>

      {/* Month/Year/Status Filters */}
      <div className="period-filters">
        <div className="filter-group-inline">
          <label>Bulan:</label>
          <select
            value={selectedMonth || ""}
            onChange={(e) =>
              setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)
            }
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

        <div className="filter-group-inline">
          <label>Tahun:</label>
          <select
            value={selectedYear || ""}
            onChange={(e) =>
              setSelectedYear(e.target.value ? parseInt(e.target.value) : null)
            }
          >
            <option value="">Semua Tahun</option>
            {getAvailableYears().map((yearOption) => (
              <option key={yearOption} value={yearOption}>
                {yearOption}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group-inline">
          <label>Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Masuk">Masuk</option>
            <option value="Keluar">Keluar</option>
            <option value="Pensiun">Pensiun</option>
            <option value="Pindah">Pindah</option>
            <option value="Rekening Berbeda">Rekening Berbeda</option>
          </select>
        </div>
      </div>

      {/* Unit Tabs */}
      <div className="unit-tabs">
        {VALID_UNITS.map((unitOption) => {
          const unitCount = data
            ? data.filter((row) => {
                const matchMonth =
                  !selectedMonth || row.month === selectedMonth;
                const matchYear = !selectedYear || row.year === selectedYear;
                // For "Semua", count all units
                const matchUnit =
                  unitOption === "Semua" || row.unit === unitOption;
                return matchMonth && matchYear && matchUnit;
              }).length
            : 0;
          return (
            <button
              key={unitOption}
              className={`unit-tab ${
                activeUnit === unitOption ? "active" : ""
              }`}
              onClick={() => setActiveUnit(unitOption)}
            >
              {unitOption}
              {unitCount > 0 && (
                <span className="unit-count">({unitCount})</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="table-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Cari NIP atau Nama..."
            value={searchText}
            onChange={onSearchChange}
            className="search-input"
          />
          {searchText && (
            <button
              onClick={clearSearch}
              className="clear-button"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div className="table-actions">
          <button
            className="download-excel-button"
            onClick={handleDownloadExcel}
            disabled={!filteredData || filteredData.length === 0}
          >
            📥 Download Excel
          </button>
          <span className="record-count">
            Total Records: {filteredData.length}
          </span>
        </div>
      </div>

      {updateMessage && (
        <div className={`update-message ${updateMessage.type}`}>
          {updateMessage.text}
        </div>
      )}

      <div className="legend">
        <div className="legend-item">
          <span className="legend-color masuk"></span>
          <span>Pegawai Masuk (Baru)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color keluar"></span>
          <span>Pegawai Keluar</span>
        </div>
        <div className="legend-item">
          <span className="legend-color pindah"></span>
          <span>Pindah</span>
        </div>
        <div className="legend-item">
          <span className="legend-color pensiun"></span>
          <span>Pensiun</span>
        </div>
        <div className="legend-item">
          <span className="legend-color berbeda"></span>
          <span>Rekening Berbeda</span>
        </div>
        <div className="legend-item">
          <span className="legend-color aktif"></span>
          <span>Aktif (Tidak Berubah)</span>
        </div>
        <div className="legend-item">
          <span style={{ fontSize: "1rem", marginRight: "4px" }}>✏️</span>
          <span>
            Status Diubah Manual (tidak akan di-overwrite saat comparison)
          </span>
        </div>
        <div className="legend-item">
          <span style={{ fontSize: "1rem", marginRight: "4px" }}>🔒</span>
          <span>
            Data dari Bulan Sebelumnya (tidak bisa diedit - pegawai yang keluar)
          </span>
        </div>
      </div>

      <div
        className="ag-theme-alpine"
        style={{ height: "600px", width: "100%" }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={filteredData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowStyle={getRowStyle}
          pagination={true}
          paginationPageSize={paginationPageSize}
          animateRows={true}
          suppressMovableColumns={true}
          suppressPaginationPanel={false}
        />
      </div>

      {/* Custom Pagination Controls */}
      <div className="custom-pagination">
        <div className="pagination-info">
          Tampilkan{" "}
          <select
            value={itemsPerPageSetting}
            onChange={(e) => {
              localStorage.setItem("itemsPerPage", e.target.value);
              window.location.reload();
            }}
            className="page-size-selector"
          >
            <option value="10">10</option>
            <option value="100">100</option>
            <option value="500">500</option>
            <option value="1000">1000</option>
            <option value="all">Semua</option>
          </select>{" "}
          baris per halaman
        </div>
      </div>
    </div>
  );
}

export default DataTable;
