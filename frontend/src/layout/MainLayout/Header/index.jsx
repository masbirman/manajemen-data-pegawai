import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import {
  AppBar,
  IconButton,
  Toolbar,
  Box,
  Avatar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";

// ==============================|| MAIN HEADER ||============================== //

const Header = ({ open, handleDrawerToggle, currentUser, onLogout }) => {
  const theme = useTheme();

  const iconBackColor = "grey.100";
  const iconBackColorOpen = "grey.200";

  const mainHeader = (
    <Toolbar>
      <IconButton
        disableRipple
        aria-label="open drawer"
        onClick={handleDrawerToggle}
        edge="start"
        color="secondary"
        sx={{
          color: "text.primary",
          bgcolor: open ? iconBackColorOpen : iconBackColor,
          ml: { xs: 0, lg: -2 },
        }}
      >
        <MenuIcon />
      </IconButton>

      <Box sx={{ width: "100%", ml: 1 }} />

      {currentUser && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              src={currentUser.avatar_url}
              sx={{ width: 34, height: 34, bgcolor: "primary.main" }}
            >
              {currentUser.full_name?.charAt(0) ||
                currentUser.username?.charAt(0)}
            </Avatar>
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {currentUser.full_name || currentUser.username}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: "capitalize" }}
              >
                {currentUser.role}
              </Typography>
            </Box>
          </Box>
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
    </Toolbar>
  );

  const appBar = {
    position: "fixed",
    color: "inherit",
    elevation: 0,
    sx: {
      borderBottom: `1px solid ${theme.palette.divider}`,
      bgcolor: "background.paper",
      zIndex: 1200,
    },
  };

  return <AppBar {...appBar}>{mainHeader}</AppBar>;
};

Header.propTypes = {
  open: PropTypes.bool,
  handleDrawerToggle: PropTypes.func,
  currentUser: PropTypes.object,
  onLogout: PropTypes.func,
};

export default Header;
