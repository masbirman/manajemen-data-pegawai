import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import {
  AppBar,
  IconButton,
  Toolbar,
  Box,
  Avatar,
  Typography,
  InputBase,
  Badge,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LogoutIcon from "@mui/icons-material/Logout";

const API_BASE_URL = process.env.REACT_APP_API_URL;

// ==============================|| MAIN HEADER - ABLE PRO STYLE ||============================== //

const Header = ({ open, handleDrawerToggle, currentUser, onLogout }) => {
  const theme = useTheme();

  const mainHeader = (
    <Toolbar sx={{ justifyContent: "space-between" }}>
      {/* Left side - Menu toggle & Search */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          disableRipple
          aria-label="open drawer"
          onClick={handleDrawerToggle}
          edge="start"
          sx={{
            color: "text.secondary",
            bgcolor: "grey.100",
            "&:hover": { bgcolor: "grey.200" },
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Search Bar - Able Pro Style */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            bgcolor: "grey.100",
            borderRadius: 1,
            px: 1.5,
            py: 0.5,
            ml: 1,
            minWidth: 200,
          }}
        >
          <SearchIcon sx={{ color: "text.secondary", fontSize: 20, mr: 1 }} />
          <InputBase
            placeholder="Ctrl + K"
            sx={{
              fontSize: "0.875rem",
              color: "text.secondary",
              "& input::placeholder": {
                opacity: 0.7,
              },
            }}
          />
        </Box>
      </Box>

      {/* Right side - Icons & User */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {/* Theme Toggle */}
        <IconButton
          sx={{
            color: "text.secondary",
            "&:hover": { bgcolor: "grey.100" },
          }}
        >
          <DarkModeOutlinedIcon fontSize="small" />
        </IconButton>

        {/* Settings */}
        <IconButton
          sx={{
            color: "text.secondary",
            "&:hover": { bgcolor: "grey.100" },
          }}
        >
          <SettingsOutlinedIcon fontSize="small" />
        </IconButton>

        {/* Notifications */}
        <IconButton
          sx={{
            color: "text.secondary",
            "&:hover": { bgcolor: "grey.100" },
          }}
        >
          <Badge badgeContent={2} color="error" variant="dot">
            <NotificationsNoneIcon fontSize="small" />
          </Badge>
        </IconButton>

        {/* User Profile */}
        {currentUser && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              ml: 1,
              pl: 1.5,
              borderLeft: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}
              >
                {currentUser.full_name || currentUser.username}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  textTransform: "capitalize",
                  fontSize: "0.7rem",
                }}
              >
                {currentUser.role}
              </Typography>
            </Box>
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
                width: 36,
                height: 36,
                bgcolor: "#5b8def",
                cursor: "pointer",
              }}
            >
              {currentUser.full_name?.charAt(0) ||
                currentUser.username?.charAt(0)}
            </Avatar>
            <IconButton
              size="small"
              onClick={onLogout}
              sx={{
                color: "text.secondary",
                "&:hover": { color: "error.main", bgcolor: "error.lighter" },
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    </Toolbar>
  );

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        zIndex: 1200,
      }}
    >
      {mainHeader}
    </AppBar>
  );
};

Header.propTypes = {
  open: PropTypes.bool,
  handleDrawerToggle: PropTypes.func,
  currentUser: PropTypes.object,
  onLogout: PropTypes.func,
};

export default Header;
