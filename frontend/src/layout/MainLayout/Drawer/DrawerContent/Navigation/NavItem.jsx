import PropTypes from "prop-types";
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
} from "@mui/material";

// ==============================|| NAVIGATION - LIST ITEM - ABLE PRO STYLE ||============================== //

const NavItem = ({ item, level, activeMenu, onMenuChange }) => {
  const Icon = item.icon;
  const itemIcon = item.icon ? <Icon style={{ fontSize: "1.25rem" }} /> : false;

  const isSelected = activeMenu === item.id;

  return (
    <ListItemButton
      disabled={item.disabled}
      selected={isSelected}
      onClick={() => onMenuChange(item.id)}
      sx={{
        zIndex: 1201,
        pl: 2,
        py: 1,
        mb: 0.5,
        borderRadius: 1,
        color: isSelected ? "#ffffff" : "rgba(255,255,255,0.7)",
        "&:hover": {
          bgcolor: "rgba(255,255,255,0.08)",
          color: "#ffffff",
        },
        "&.Mui-selected": {
          bgcolor: "#5b8def",
          color: "#ffffff",
          "&:hover": {
            bgcolor: "#4a7de0",
          },
          "& .MuiListItemIcon-root": {
            color: "#ffffff",
          },
        },
      }}
    >
      {itemIcon && (
        <ListItemIcon
          sx={{
            minWidth: 36,
            color: isSelected ? "#ffffff" : "rgba(255,255,255,0.7)",
          }}
        >
          {itemIcon}
        </ListItemIcon>
      )}
      <ListItemText
        primary={
          <Typography
            variant="body2"
            sx={{
              fontWeight: isSelected ? 600 : 400,
              color: "inherit",
              fontSize: "0.875rem",
            }}
          >
            {item.title}
          </Typography>
        }
      />
      {item.chip && (
        <Chip
          label={item.chip.label}
          size="small"
          sx={{
            height: 20,
            fontSize: "0.65rem",
            bgcolor: item.chip.color || "#5b8def",
            color: "#ffffff",
          }}
        />
      )}
    </ListItemButton>
  );
};

NavItem.propTypes = {
  item: PropTypes.object,
  level: PropTypes.number,
  activeMenu: PropTypes.string,
  onMenuChange: PropTypes.func,
};

export default NavItem;
