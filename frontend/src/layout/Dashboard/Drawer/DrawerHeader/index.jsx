import PropTypes from "prop-types";
import { useState, useEffect } from "react";

// material-ui
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";

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
      {/* Logo & Title */}
      <DrawerHeaderStyled
        open={open}
        sx={{
          minHeight: HEADER_HEIGHT,
          width: "initial",
          paddingTop: "8px",
          paddingBottom: "8px",
          paddingLeft: open ? "24px" : 0,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
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
                bgcolor: "primary.main",
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
          {open && (
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}
              >
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tagline}
              </Typography>
            </Box>
          )}
        </Stack>
      </DrawerHeaderStyled>

      {/* User Profile Section */}
      {currentUser && open && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 2,
            mx: 1.5,
            mb: 1,
            bgcolor: "secondary.lighter",
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
              bgcolor: "primary.main",
              fontSize: "1rem",
            }}
          >
            {currentUser.full_name
              ? currentUser.full_name.charAt(0).toUpperCase()
              : currentUser.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "text.primary" }}
              noWrap
            >
              {currentUser.full_name || currentUser.username}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", textTransform: "capitalize" }}
            >
              {currentUser.role}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

DrawerHeader.propTypes = {
  open: PropTypes.bool,
  currentUser: PropTypes.object,
};
