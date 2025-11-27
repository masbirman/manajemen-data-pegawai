import PropTypes from "prop-types";

// material-ui
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Badge from "@mui/material/Badge";

// icons
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutIcon from "@mui/icons-material/Logout";

const API_BASE_URL = process.env.REACT_APP_API_URL;

// ==============================|| HEADER - CONTENT ||============================== //

export default function HeaderContent({ currentUser, onLogout }) {
  const downLG = useMediaQuery((theme) => theme.breakpoints.down("lg"));

  return (
    <>
      {/* Search */}
      {!downLG && (
        <Box sx={{ width: "100%", ml: { xs: 0, md: 2 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "secondary.lighter",
              borderRadius: 1,
              px: 1.5,
              py: 0.5,
              width: { xs: "100%", md: 224 },
            }}
          >
            <SearchIcon sx={{ color: "secondary.main", fontSize: 20, mr: 1 }} />
            <InputBase
              placeholder="Ctrl + K"
              sx={{
                fontSize: "0.875rem",
                color: "secondary.main",
                "& input::placeholder": { opacity: 0.7 },
              }}
            />
          </Box>
        </Box>
      )}

      {downLG && <Box sx={{ width: 1, ml: 1 }} />}

      {/* Notification */}
      <IconButton
        sx={{
          color: "secondary.main",
          "&:hover": { bgcolor: "secondary.lighter" },
        }}
      >
        <Badge badgeContent={2} color="error" variant="dot">
          <NotificationsNoneIcon />
        </Badge>
      </IconButton>

      {/* Settings */}
      <IconButton
        sx={{
          color: "secondary.main",
          "&:hover": { bgcolor: "secondary.lighter" },
        }}
      >
        <SettingsOutlinedIcon />
      </IconButton>

      {/* Profile */}
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
                  fontSize: "0.7rem",
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
              width: 36,
              height: 36,
              bgcolor: "primary.main",
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
              color: "secondary.main",
              "&:hover": { color: "error.main", bgcolor: "error.lighter" },
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </>
  );
}

HeaderContent.propTypes = {
  currentUser: PropTypes.object,
  onLogout: PropTypes.func,
};
