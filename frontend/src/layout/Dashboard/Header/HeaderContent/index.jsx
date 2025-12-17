import PropTypes from "prop-types";
import { useState, useEffect } from "react";

// material-ui
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";

// icons
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LogoutIcon from "@mui/icons-material/Logout";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Helper to build avatar URL
const buildAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return null;
  const baseUrl = avatarUrl.startsWith('/uploads')
    ? `${API_BASE_URL}${avatarUrl}`
    : avatarUrl;
  return `${baseUrl}?t=${Date.now()}`;
};

// ==============================|| HEADER - CONTENT ||============================== //

export default function HeaderContent({ currentUser: propUser, onLogout }) {
  const downLG = useMediaQuery((theme) => theme.breakpoints.down("lg"));
  
  // Use internal state that can be updated independently
  const [user, setUser] = useState(propUser);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  // Sync with prop changes
  useEffect(() => {
    setUser(propUser);
    setAvatarKey(Date.now());
  }, [propUser, propUser?.avatar_url, propUser?._refreshedAt]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      // Read fresh user data from localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setAvatarKey(Date.now()); // Force avatar re-render
        } catch (e) {
          console.warn("Failed to parse user from localStorage", e);
        }
      }
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    window.addEventListener("storage", handleProfileUpdate);
    
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
      window.removeEventListener("storage", handleProfileUpdate);
    };
  }, []);

  const avatarUrl = buildAvatarUrl(user?.avatar_url);

  return (
    <>
      {/* Spacer to push everything to the right */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Notification */}
      <Tooltip title="Notifications">
        <IconButton
          sx={{
            color: "text.secondary",
            mr: 2,
            "&:hover": { bgcolor: "action.hover", color: "primary.main" },
          }}
        >
          <Badge badgeContent={2} color="error" variant="dot">
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Profile Section */}
      {user && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            pl: 2,
            borderLeft: "1px solid",
            borderColor: "divider",
          }}
        >
          {!downLG && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}
              >
                {user.full_name || user.username}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  textTransform: "capitalize",
                  fontSize: "0.75rem",
                }}
              >
                {user.role}
              </Typography>
            </Box>
          )}
          
          <Avatar
            key={avatarKey}
            src={avatarUrl}
            sx={{
              width: 40,
              height: 40,
              bgcolor: "primary.main",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              border: "2px solid #fff"
            }}
          >
            {user.full_name?.charAt(0) || user.username?.charAt(0)}
          </Avatar>

          <Tooltip title="Logout">
            <IconButton
              size="small"
              onClick={onLogout}
              sx={{
                ml: 0.5,
                color: "text.secondary",
                "&:hover": { color: "error.main", bgcolor: "error.lighter" },
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </>
  );
}

HeaderContent.propTypes = {
  currentUser: PropTypes.object,
  onLogout: PropTypes.func,
};
