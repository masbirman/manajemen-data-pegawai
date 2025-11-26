import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { Box, Typography, Avatar, IconButton } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

const API_BASE_URL = process.env.REACT_APP_API_URL;

// ==============================|| DRAWER HEADER - ABLE PRO STYLE ||============================== //

const DrawerHeader = ({ open, currentUser }) => {
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
              API_BASE_URL
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

  return (
    <Box>
      {/* Logo & Title Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 2.5,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt="Logo"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              objectFit: "contain",
            }}
          />
        ) : (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              bgcolor: "#5b8def",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            📊
          </Box>
        )}
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: "#ffffff",
              fontSize: "0.95rem",
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.7rem" }}
          >
            {tagline}
          </Typography>
        </Box>
      </Box>

      {/* User Profile Section - Able Pro Style */}
      {currentUser && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 2,
            mx: 1.5,
            my: 1.5,
            bgcolor: "rgba(255,255,255,0.08)",
            borderRadius: 2,
          }}
        >
          <Avatar
            src={
              currentUser.avatar_url
                ? currentUser.avatar_url.replace(
                    /http:\/\/localhost:\d+/,
                    API_BASE_URL
                  )
                : undefined
            }
            sx={{
              width: 40,
              height: 40,
              bgcolor: "#5b8def",
              fontSize: "1rem",
            }}
          >
            {currentUser.full_name
              ? currentUser.full_name.charAt(0).toUpperCase()
              : currentUser.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: "#ffffff",
                fontSize: "0.85rem",
              }}
              noWrap
            >
              {currentUser.full_name || currentUser.username}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.6)",
                textTransform: "capitalize",
                fontSize: "0.7rem",
              }}
            >
              {currentUser.role}
            </Typography>
          </Box>
          <IconButton
            size="small"
            sx={{
              color: "rgba(255,255,255,0.6)",
              "&:hover": { color: "#ffffff", bgcolor: "rgba(255,255,255,0.1)" },
            }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

DrawerHeader.propTypes = {
  open: PropTypes.bool,
  currentUser: PropTypes.object,
};

export default DrawerHeader;
