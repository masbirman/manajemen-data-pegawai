import PropTypes from "prop-types";

// material-ui
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

// project-imports
import NavGroup from "./NavGroup";
import { useGetMenuMaster } from "../../../../../api/menu";
import menuItems from "../../../../../menu-items";

// ==============================|| DRAWER CONTENT - NAVIGATION ||============================== //

export default function Navigation({
  activeMenu,
  onMenuChange,
  currentUser,
  hasPermission,
}) {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  // Get menu items with user permissions
  const items = menuItems(currentUser, hasPermission).items;

  const navGroups = items.map((item) => {
    switch (item.type) {
      case "group":
        return (
          <NavGroup
            key={item.id}
            item={item}
            activeMenu={activeMenu}
            onMenuChange={onMenuChange}
          />
        );
      default:
        return (
          <Typography key={item.id} variant="h6" color="error" align="center">
            Fix - Navigation Group
          </Typography>
        );
    }
  });

  return (
    <Box
      sx={{
        pt: drawerOpen ? 2 : 0,
        "& > ul:first-of-type": { mt: 0 },
        display: "block",
        alignItems: "center",
      }}
    >
      {navGroups}
    </Box>
  );
}

Navigation.propTypes = {
  activeMenu: PropTypes.string,
  onMenuChange: PropTypes.func,
  currentUser: PropTypes.object,
  hasPermission: PropTypes.func,
};
