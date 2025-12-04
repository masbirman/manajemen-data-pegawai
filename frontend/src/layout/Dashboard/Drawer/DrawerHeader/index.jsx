import PropTypes from "prop-types";
import { useState, useEffect } from "react";

// material-ui
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";

// project-imports
import DrawerHeaderStyled from "./DrawerHeaderStyled";
import { HEADER_HEIGHT } from "../../../../config";

const API_BASE_URL = process.env.REACT_APP_API_URL;

// ==============================|| DRAWER HEADER - WITH USER PROFILE ||============================== //

export default function DrawerHeader({ open, currentUser }) {
  const [logoSrc, setLogoSrc] = useState(null);
  const [title, setTitle] = useState("Data Pegawai");
  const [tagline, setTagline] = useState("Sistem Perbandingan");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        if (!API_BASE_URL) return;
        const response = await fetch(`${API_BASE_URL}/landing/settings`);
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
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
        }
      } catch (err) {
        console.warn("Failed to fetch sidebar settings:", err);
      }
    };

    fetchSettings();
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* Logo & Title */}
      <DrawerHeaderStyled
        open={open}
        sx={{
          minHeight: HEADER_HEIGHT,
          width: "initial",
          paddingTop: "16px",
          paddingBottom: "16px",
          paddingLeft: open ? "24px" : 0,
          justifyContent: open ? "flex-start" : "center",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="Logo"
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                objectFit: "contain",
              }}
            />
          ) : (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", // Brighter Blue
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: "1.2rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
              }}
            >
              📊
            </Box>
          )}
          {open && (
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ 
                  fontWeight: 700, 
                  color: "#ffffff", // White text
                  lineHeight: 1.2,
                  fontSize: "1rem"
                }}
              >
                {title}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                {tagline}
              </Typography>
            </Box>
          )}
        </Stack>
      </DrawerHeaderStyled>

      {/* User Profile Section Removed - Moved to Navbar */}
      
      {open && <Divider sx={{ mx: 2, mb: 1, borderColor: "rgba(255, 255, 255, 0.1)" }} />}
    </Box>
  );
}

DrawerHeader.propTypes = {
  open: PropTypes.bool,
  currentUser: PropTypes.object,
};
