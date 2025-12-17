import PropTypes from "prop-types";

// material-ui
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme, alpha } from "@mui/material/styles";
import Chip from "@mui/material/Chip";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

// project-imports
import { handlerDrawerOpen, useGetMenuMaster } from "../../../../../api/menu";

// ==============================|| NAVIGATION - ITEM ||============================== //

export default function NavItem({ item, level, activeMenu, onMenuChange }) {
  const theme = useTheme();
  const downLG = useMediaQuery((theme) => theme.breakpoints.down("lg"));

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const Icon = item.icon;
  const itemIcon = item.icon ? (
    <Icon style={{ fontSize: drawerOpen ? 20 : 22 }} />
  ) : (
    false
  );

  const isSelected = activeMenu === item.id;
  
  // Dark Sidebar Colors
  const textColor = theme.palette.grey[300]; // Clean Light Grey
  const activeTextColor = "#ffffff";
  const activeBgColor = alpha(theme.palette.primary.main, 0.2); // Solid active state using primary color
  const hoverBgColor = alpha(theme.palette.common.white, 0.05);

  const itemHandler = () => {
    if (downLG) handlerDrawerOpen(false);
    if (onMenuChange) {
      onMenuChange(item.id);
    }
  };

  return (
    <Box sx={{ position: "relative" }}>
      <ListItemButton
        disabled={item.disabled}
        selected={isSelected}
        sx={{
          zIndex: 1201,
          pl: drawerOpen ? 2.5 : 1.5,
          py: !drawerOpen && level === 1 ? 1.25 : 1,
          mb: 0.5,
          ...(drawerOpen && {
            "&:hover": { 
              bgcolor: hoverBgColor,
              color: activeTextColor
            },
            "&.Mui-selected": {
              bgcolor: activeBgColor,
              color: activeTextColor,
              "&:hover": { 
                bgcolor: activeBgColor, // Keep distinct
                color: activeTextColor
              },
              borderRight: `3px solid ${theme.palette.primary.main}` // Solid accent from theme
            },
          }),
          ...(drawerOpen &&
            level === 1 && {
              mx: 1.25,
              borderRadius: "8px",
            }),
          ...(!drawerOpen && {
            px: 2.75,
            justifyContent: "center",
            "&:hover": { bgcolor: "transparent" },
            "&.Mui-selected": {
              "&:hover": { bgcolor: "transparent" },
              bgcolor: "transparent",
            },
          }),
        }}
        onClick={itemHandler}
      >
        {itemIcon && (
          <ListItemIcon
            sx={{
              minWidth: 38,
              color: isSelected ? activeTextColor : textColor,
              ...(!drawerOpen &&
                level === 1 && {
                  borderRadius: 1,
                  width: 46,
                  height: 46,
                  alignItems: "center",
                  justifyContent: "center",
                  "&:hover": { bgcolor: hoverBgColor },
                }),
              ...(!drawerOpen &&
                isSelected && {
                  bgcolor: activeBgColor,
                  color: activeTextColor,
                  "&:hover": { bgcolor: activeBgColor },
                }),
            }}
          >
            {itemIcon}
          </ListItemIcon>
        )}

        {(drawerOpen || (!drawerOpen && level !== 1)) && (
          <ListItemText
            primary={
              <Typography
                variant="h6"
                sx={{
                  color: isSelected ? activeTextColor : textColor,
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                {item.title}
              </Typography>
            }
          />
        )}
        {(drawerOpen || (!drawerOpen && level !== 1)) && item.chip && (
          <Chip
            color={item.chip.color}
            variant={item.chip.variant}
            size={item.chip.size}
            label={item.chip.label}
          />
        )}
      </ListItemButton>
    </Box>
  );
}

NavItem.propTypes = {
  item: PropTypes.any,
  level: PropTypes.number,
  activeMenu: PropTypes.string,
  onMenuChange: PropTypes.func,
};
