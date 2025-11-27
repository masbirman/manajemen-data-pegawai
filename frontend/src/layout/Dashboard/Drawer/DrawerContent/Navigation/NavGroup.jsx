import PropTypes from "prop-types";

// material-ui
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

// project-imports
import NavItem from "./NavItem";
import { useGetMenuMaster } from "../../../../../api/menu";

// ==============================|| NAVIGATION - GROUP ||============================== //

export default function NavGroup({ item, activeMenu, onMenuChange }) {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const navCollapse = item.children?.map((menuItem, index) => {
    switch (menuItem.type) {
      case "item":
        return (
          <NavItem
            key={menuItem.id}
            item={menuItem}
            level={1}
            activeMenu={activeMenu}
            onMenuChange={onMenuChange}
          />
        );
      default:
        return (
          <Typography key={index} variant="h6" color="error" align="center">
            Fix - Group Collapse or Items
          </Typography>
        );
    }
  });

  return (
    <List
      subheader={
        <>
          {item.title ? (
            drawerOpen && (
              <Box sx={{ pl: 3, mb: 1.5 }}>
                <Typography
                  variant="h5"
                  sx={{
                    textTransform: "uppercase",
                    fontSize: "0.688rem",
                    color: "secondary.dark",
                    fontWeight: 600,
                  }}
                >
                  {item.title}
                </Typography>
                {item.caption && (
                  <Typography variant="caption" color="secondary">
                    {item.caption}
                  </Typography>
                )}
              </Box>
            )
          ) : (
            <Divider sx={{ my: 0.5 }} />
          )}
        </>
      }
      sx={{ mt: drawerOpen && item.title ? 1.5 : 0, py: 0, zIndex: 0 }}
    >
      {navCollapse}
    </List>
  );
}

NavGroup.propTypes = {
  item: PropTypes.any,
  activeMenu: PropTypes.string,
  onMenuChange: PropTypes.func,
};
