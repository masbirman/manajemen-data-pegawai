import { useEffect } from "react";

// material-ui
import useMediaQuery from "@mui/material/useMediaQuery";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";

// project-imports
import Drawer from "./Drawer";
import Header from "./Header";

import { handlerDrawerOpen, useGetMenuMaster } from "../../api/menu";
import { DRAWER_WIDTH } from "../../config";

// ==============================|| MAIN LAYOUT - ABLE PRO STYLE ||============================== //

export default function DashboardLayout({
  children,
  activeMenu,
  onMenuChange,
  currentUser,
  onLogout,
  hasPermission,
}) {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const downXL = useMediaQuery((theme) => theme.breakpoints.down("xl"));

  // set media wise responsive drawer
  useEffect(() => {
    handlerDrawerOpen(!downXL);
  }, [downXL]);

  return (
    <Box sx={{ display: "flex", width: "100%" }}>
      <Header currentUser={currentUser} onLogout={onLogout} />
      <Drawer
        activeMenu={activeMenu}
        onMenuChange={onMenuChange}
        currentUser={currentUser}
        hasPermission={hasPermission}
      />

      <Box
        component="main"
        sx={{
          width: drawerOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : "100%",
          flexGrow: 1,
          p: { xs: 1, sm: 3 },
          bgcolor: "secondary.lighter",
          minHeight: "100vh",
          overflow: "auto",
        }}
      >
        <Toolbar sx={{ mt: "inherit", mb: "inherit" }} />
        <Box
          sx={{
            position: "relative",
            minHeight: "calc(100vh - 124px)",
            display: "flex",
            flexDirection: "column",
            pb: 3,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
