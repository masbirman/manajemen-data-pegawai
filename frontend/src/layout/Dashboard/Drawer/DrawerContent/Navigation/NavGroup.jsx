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
              <Box sx={{ pl: 2.5, mb: 1, mt: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                    color: "#94a3b8", // Slate 400 for dark background
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    display: "block"
                  }}
                >
                  {item.title}
                </Typography>
                {item.caption && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: "#64748b" }}>
                    {item.caption}
                  </Typography>
                )}
              </Box>
            )
          ) : (
            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
          )}
        </>
      }
      sx={{ mt: 0, py: 0, zIndex: 0 }}
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
