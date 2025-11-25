# Auto-Refresh Dashboard - Dokumentasi

## Fitur Baru: Auto-Refresh Dashboard

### Deskripsi

Dashboard sekarang akan **otomatis refresh** setiap kali ada perubahan status pegawai di menu Perbandingan atau Arsip. Tidak perlu lagi klik tombol Refresh secara manual.

## Cara Kerja

### 1. Trigger Auto-Refresh

Auto-refresh akan terjadi ketika:

- User mengubah status pegawai di DataTable (klik kolom Status)
- Status berhasil tersimpan ke database
- Event `statusUpdated` di-trigger

### 2. Visual Indicator

Saat auto-refresh berjalan:

- Tombol "🔄 Refresh" berubah menjadi "🔄 Auto-refreshing..."
- Muncul badge kuning "⚡ Auto-refreshing..." dengan animasi pulse
- Tombol Refresh di-disable sementara

### 3. Proses Auto-Refresh

1. User mengubah status di menu Perbandingan/Arsip
2. Notifikasi sukses muncul: "Status pegawai berhasil diubah menjadi 'Pensiun'. Dashboard akan otomatis ter-update."
3. Event `statusUpdated` di-broadcast ke semua komponen
4. Dashboard mendeteksi event dan mulai refresh
5. Data terbaru di-fetch dari API
6. Tabel breakdown status per unit ter-update
7. Summary cards ter-update (Total Pegawai, Total Unit, Manual Override)
8. Auto-refresh selesai dalam ~1 detik

## Technical Implementation

### Event Communication

```javascript
// DataTable.jsx - Trigger event after status update
window.dispatchEvent(new CustomEvent("statusUpdated"));

// Dashboard.jsx - Listen for event
window.addEventListener("statusUpdated", handleStatusUpdate);
```

### State Management

```javascript
const [autoRefreshing, setAutoRefreshing] = useState(false);

const handleStatusUpdate = async () => {
  setAutoRefreshing(true);
  await loadDashboardData(selectedMonth, selectedYear, false);
  setTimeout(() => setAutoRefreshing(false), 1000);
};
```

### Visual Feedback

- CSS animation `pulse` untuk indicator
- Disabled state untuk tombol Refresh
- Badge dengan gradient background

## User Experience Flow

### Scenario 1: Ubah Status di Perbandingan

1. Buka menu **Perbandingan**
2. Pilih bulan/tahun (misal: November 2025)
3. Klik **Bandingkan Data**
4. Klik kolom **Status** pada pegawai yang ingin diubah
5. Pilih status baru (misal: dari "Keluar" ke "Pensiun")
6. ✅ Notifikasi sukses muncul
7. ⚡ Dashboard otomatis refresh (jika sedang dibuka)
8. Buka menu **Dashboard**
9. Pilih bulan/tahun yang sama (November 2025)
10. ✅ Data sudah ter-update tanpa perlu klik Refresh

### Scenario 2: Ubah Status di Arsip

1. Buka menu **Arsip**
2. Filter data berdasarkan bulan/tahun
3. Klik kolom **Status** untuk mengubah
4. ✅ Notifikasi sukses muncul
5. ⚡ Dashboard otomatis refresh
6. Perubahan langsung terlihat di Dashboard

## Benefits

### 1. Better UX

- Tidak perlu manual refresh
- Real-time data update
- Seamless experience

### 2. Reduced Confusion

- User tidak bingung kenapa data tidak update
- Visual feedback yang jelas
- Notifikasi yang informatif

### 3. Efficiency

- Hemat waktu user
- Mengurangi klik yang tidak perlu
- Data selalu up-to-date

## Compatibility

### Browser Support

- Chrome ✅
- Firefox ✅
- Edge ✅
- Safari ✅

### Features Used

- CustomEvent API (widely supported)
- Event Listeners
- Async/Await
- CSS Animations

## Troubleshooting

### Dashboard tidak auto-refresh

**Kemungkinan penyebab:**

1. Dashboard tidak sedang dibuka saat status diubah

   - **Solusi:** Buka Dashboard, akan auto-refresh saat ada perubahan berikutnya

2. Browser tab tidak aktif

   - **Solusi:** Klik tab Dashboard untuk mengaktifkan

3. Network error
   - **Solusi:** Cek koneksi internet, klik tombol Refresh manual

### Auto-refresh terlalu cepat/lambat

**Konfigurasi:**

```javascript
// Dashboard.jsx - Adjust delay
setTimeout(() => setAutoRefreshing(false), 1000); // 1 second
```

### Multiple refresh terjadi

**Penyebab:** Multiple status changes dalam waktu singkat
**Behavior:** Normal, setiap perubahan akan trigger refresh

## Future Enhancements

### Possible Improvements:

1. **Debounce multiple refreshes** - Jika ada banyak perubahan dalam waktu singkat, hanya refresh sekali
2. **Refresh only affected unit** - Hanya refresh data unit yang berubah, bukan semua
3. **WebSocket integration** - Real-time sync antar user
4. **Offline support** - Queue refresh saat offline, execute saat online
5. **Refresh history** - Log semua auto-refresh untuk debugging

## Changelog

### Version 1.2.0 (2024-11-25)

- ✅ Implementasi auto-refresh Dashboard
- ✅ Event-based communication antar komponen
- ✅ Visual indicator saat auto-refresh
- ✅ Notifikasi yang lebih informatif
- ✅ Disable tombol Refresh saat auto-refresh
- ✅ CSS animation untuk feedback

## Related Features

- Manual Status Override (v1.1.0)
- Dashboard Breakdown per Unit (v1.1.0)
- Real-time Notifications (v1.0.0)

## Support

Jika ada pertanyaan atau masalah, silakan hubungi tim development.
