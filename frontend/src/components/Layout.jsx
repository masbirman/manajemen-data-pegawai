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
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          bgcolor: "#f5f5f5",
          minHeight: "100vh",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout;
