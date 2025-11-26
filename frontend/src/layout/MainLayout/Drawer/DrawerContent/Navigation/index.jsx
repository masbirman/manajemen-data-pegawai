import { Box, List, Typography } from "@mui/material";
import NavItem from "./NavItem";
import menuItems from "../../../../../menu-items";

// ==============================|| NAVIGATION ||============================== //

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
          <Box key={item.id} sx={{ pt: 2, pb: 1 }}>
            {item.title && (
              <Typography
                variant="caption"
                sx={{
                  px: 3,
                  py: 1,
                  color: "text.secondary",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  fontSize: "0.75rem",
                }}
              >
                {item.title}
              </Typography>
            )}
            <List sx={{ px: 1.5 }}>
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

  return <Box sx={{ pt: 1 }}>{navGroups}</Box>;
};

export default Navigation;
