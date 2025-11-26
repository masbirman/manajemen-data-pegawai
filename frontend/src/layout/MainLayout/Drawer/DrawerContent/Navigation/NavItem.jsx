import PropTypes from "prop-types";
import { forwardRef, useEffect } from "react";
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

// ==============================|| NAVIGATION - LIST ITEM ||============================== //

const NavItem = ({ item, level, activeMenu, onMenuChange }) => {
  const Icon = item.icon;
  const itemIcon = item.icon ? <Icon style={{ fontSize: "1.25rem" }} /> : false;

  const isSelected = activeMenu === item.id;

  const textColor = "text.primary";
  const iconSelectedColor = "primary.main";

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
        "&:hover": {
          bgcolor: "primary.lighter",
        },
        "&.Mui-selected": {
          bgcolor: "primary.lighter",
          borderRight: "2px solid",
          borderColor: "primary.main",
          color: iconSelectedColor,
          "&:hover": {
            bgcolor: "primary.lighter",
          },
        },
      }}
    >
      {itemIcon && (
        <ListItemIcon
          sx={{
            minWidth: 36,
            color: isSelected ? iconSelectedColor : textColor,
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
              color: isSelected ? iconSelectedColor : textColor,
            }}
          >
            {item.title}
          </Typography>
        }
      />
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
