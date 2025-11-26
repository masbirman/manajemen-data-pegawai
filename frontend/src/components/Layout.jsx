import React from "react";
import { Box, CssBaseline } from "@mui/material";
import SidebarNew from "./SidebarNew";

const DRAWER_WIDTH = 260;

function Layout({
  children,
  activeMenu,
  onMenuChange,
  currentUser,
  onLogout,
  hasPermission,
}) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <CssBaseline />

      <SidebarNew
        drawerWidth={DRAWER_WIDTH}
        activeMenu={activeMenu}
        onMenuChange={onMenuChange}
        currentUser={currentUser}
        onLogout={onLogout}
        hasPermission={hasPermission}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: "#f5f5f5",
          minHeight: "100vh",
          marginLeft: `${DRAWER_WIDTH}px`,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout;
