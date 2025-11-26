import PropTypes from "prop-types";
import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Drawer, useMediaQuery } from "@mui/material";

// project import
import DrawerHeader from "./DrawerHeader";
import DrawerContent from "./DrawerContent";
import MiniDrawerStyled from "./MiniDrawerStyled";

// ==============================|| MAIN DRAWER ||============================== //

const MainDrawer = ({
  open,
  handleDrawerToggle,
  activeMenu,
  onMenuChange,
  currentUser,
  hasPermission,
  window,
}) => {
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("lg"));

  const drawerWidth = 260;

  const container =
    window !== undefined ? () => window().document.body : undefined;

  const drawerContent = useMemo(
    () => (
      <DrawerContent
        activeMenu={activeMenu}
        onMenuChange={onMenuChange}
        currentUser={currentUser}
        hasPermission={hasPermission}
      />
    ),
    [activeMenu, onMenuChange, currentUser, hasPermission]
  );
  const drawerHeader = useMemo(() => <DrawerHeader open={open} />, [open]);

  return (
    <Box
      component="nav"
      sx={{ flexShrink: { md: 0 }, zIndex: 1300 }}
      aria-label="mailbox folders"
    >
      {!matchDownMD ? (
        <MiniDrawerStyled variant="permanent" open={open}>
          {drawerHeader}
          {drawerContent}
        </MiniDrawerStyled>
      ) : (
        <Drawer
          container={container}
          variant="temporary"
          open={open}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", lg: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundImage: "none",
              boxShadow: "inherit",
            },
          }}
        >
          {drawerHeader}
          {drawerContent}
        </Drawer>
      )}
    </Box>
  );
};

MainDrawer.propTypes = {
  open: PropTypes.bool,
  handleDrawerToggle: PropTypes.func,
  activeMenu: PropTypes.string,
  onMenuChange: PropTypes.func,
  currentUser: PropTypes.object,
  hasPermission: PropTypes.func,
  window: PropTypes.object,
};

export default MainDrawer;
