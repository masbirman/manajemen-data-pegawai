import { Box, List, Typography } from "@mui/material";
import NavItem from "./NavItem";
import menuItems from "../../../../../menu-items";

// ==============================|| NAVIGATION - ABLE PRO STYLE ||============================== //

const Navigation = ({
  activeMenu,
  onMenuChange,
  currentUser,
  hasPermission,
}) => {
  const navGroups = menuItems(currentUser, hasPermission).items.map((item) => {
    switch (item.type) {
      case "group":
        return (
          <Box key={item.id} sx={{ pt: 1.5, pb: 0.5 }}>
            {item.title && (
              <Typography
                variant="caption"
                sx={{
                  px: 2.5,
                  py: 1,
                  display: "block",
                  color: "rgba(255,255,255,0.4)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: "0.5px",
                }}
              >
                {item.title}
              </Typography>
            )}
            <List sx={{ px: 1.5, py: 0 }}>
              {item.children?.map((menuItem) => (
                <NavItem
                  key={menuItem.id}
                  item={menuItem}
                  level={1}
                  activeMenu={activeMenu}
                  onMenuChange={onMenuChange}
                />
              ))}
            </List>
          </Box>
        );
      default:
        return (
          <Typography key={item.id} variant="h6" color="error" align="center">
            Fix - Navigation Group
          </Typography>
        );
    }
  });

  return <Box sx={{ pt: 0.5 }}>{navGroups}</Box>;
};

export default Navigation;
