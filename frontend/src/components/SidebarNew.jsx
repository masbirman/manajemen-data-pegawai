import React, { useState, useEffect } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  IconButton,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  CompareArrows as CompareIcon,
  CloudUpload as UploadIcon,
  Archive as ArchiveIcon,
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function SidebarNew({
  drawerWidth,
  activeMenu,
  onMenuChange,
  currentUser,
  onLogout,
  hasPermission,
}) {
  const [logoSrc, setLogoSrc] = useState(null);
  const [title, setTitle] = useState("Data Pegawai");
  const [tagline, setTagline] = useState("Sistem Perbandingan");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/landing/settings`);
        if (response.ok) {
          const data = await response.json();
          const settings = data.settings;

          if (settings.sidebar_logo_url) {
            const fixedUrl = settings.sidebar_logo_url.replace(
              /http:\/\/localhost:\d+/,
              process.env.REACT_APP_API_URL || "http://localhost:8000"
            );
            setLogoSrc(fixedUrl);
          }
          if (settings.sidebar_title) {
            setTitle(settings.sidebar_title);
          }
          if (settings.sidebar_tagline) {
            setTagline(settings.sidebar_tagline);
          }
        }
      } catch (err) {
        console.error("Failed to fetch sidebar settings:", err);
      }
    };

    fetchSettings();
  }, []);

  const menuItems = [
    {
      id: "dashboard",
      icon: <DashboardIcon />,
      label: "Dashboard",
      permission: "dashboard",
    },
    {
      id: "comparison",
      icon: <CompareIcon />,
      label: "Perbandingan Data",
      permission: "compare",
    },
    {
      id: "upload",
      icon: <UploadIcon />,
      label: "Upload Data",
      permission: "upload",
    },
    {
      id: "archive",
      icon: <ArchiveIcon />,
      label: "Arsip Data",
      permission: "archive",
    },
    {
      id: "admin",
      icon: <AdminIcon />,
      label: "Admin Panel",
      superadminOnly: true,
    },
    {
      id: "user-management",
      icon: <PeopleIcon />,
      label: "User Management",
      superadminOnly: true,
    },
    {
      id: "landing-settings",
      icon: <HomeIcon />,
      label: "Landing Page",
      superadminOnly: true,
    },
    {
      id: "profile",
      icon: <PersonIcon />,
      label: "Edit Profil",
      superadminOnly: true,
    },
    {
      id: "settings",
      icon: <SettingsIcon />,
      label: "Pengaturan",
      superadminOnly: true,
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.superadminOnly && currentUser?.role !== "superadmin") {
      return false;
    }
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    return true;
  });

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt="Logo"
            style={{ maxWidth: "140px", height: "auto" }}
          />
        ) : (
          <Typography variant="h6" sx={{ color: "#1976d2", fontWeight: 600 }}>
            📊
          </Typography>
        )}
      </Box>

      {/* Title Section */}
      <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50" }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: "#8898aa" }}>
          {tagline}
        </Typography>
      </Box>

      {/* Menu Items */}
      <List sx={{ flexGrow: 1, py: 1 }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={activeMenu === item.id}
              onClick={() => onMenuChange(item.id)}
              sx={{
                mx: 1,
                borderRadius: 1,
                "&.Mui-selected": {
                  bgcolor: "#e3f2fd",
                  color: "#1976d2",
                  "& .MuiListItemIcon-root": {
                    color: "#1976d2",
                  },
                  "&:hover": {
                    bgcolor: "#bbdefb",
                  },
                },
                "&:hover": {
                  bgcolor: "#f5f5f5",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "#67757c" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: activeMenu === item.id ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* User Info & Logout */}
      {currentUser && (
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.5,
              bgcolor: "#f5f5f5",
              borderRadius: 2,
            }}
          >
            <Avatar
              src={
                currentUser.avatar_url
                  ? currentUser.avatar_url.replace(
                      /http:\/\/localhost:\d+/,
                      process.env.REACT_APP_API_URL || "http://localhost:8000"
                    )
                  : undefined
              }
              sx={{ width: 36, height: 36, bgcolor: "#1976d2" }}
            >
              {currentUser.full_name
                ? currentUser.full_name.charAt(0).toUpperCase()
                : currentUser.username.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#2c3e50", fontSize: "0.85rem" }}
                noWrap
              >
                {currentUser.full_name || currentUser.username}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#8898aa", textTransform: "capitalize" }}
              >
                {currentUser.role}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={onLogout}
              sx={{
                color: "#67757c",
                "&:hover": { bgcolor: "#e0e0e0", color: "#d32f2f" },
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              mt: 1,
              color: "#8898aa",
            }}
          >
            © 2024 Aplikasi Perbandingan Data Pegawai
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          bgcolor: "#ffffff",
          borderRight: "1px solid #e0e0e0",
        },
      }}
    >
      {drawer}
    </Drawer>
  );
}

export default SidebarNew;
