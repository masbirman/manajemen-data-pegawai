import PropTypes from "prop-types";

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
import PersonIcon from "@mui/icons-material/Person";

const API_BASE_URL = process.env.REACT_APP_API_URL;

// ==============================|| HEADER - CONTENT ||============================== //

export default function HeaderContent({ currentUser, onLogout }) {
  const downLG = useMediaQuery((theme) => theme.breakpoints.down("lg"));

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
      {currentUser && (
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
                {currentUser.full_name || currentUser.username}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  textTransform: "capitalize",
                  fontSize: "0.75rem",
                }}
              >
                {currentUser.role}
              </Typography>
            </Box>
          )}
          
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
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              border: "2px solid #fff"
            }}
          >
            {currentUser.full_name?.charAt(0) ||
              currentUser.username?.charAt(0)}
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
