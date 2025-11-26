import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box, Toolbar, useMediaQuery } from "@mui/material";

// project import
import Drawer from "./Drawer";
import Header from "./Header";

// ==============================|| MAIN LAYOUT ||============================== //

const MainLayout = ({
  activeMenu,
  onMenuChange,
  currentUser,
  onLogout,
  hasPermission,
}) => {
  const theme = useTheme();
  const matchDownLG = useMediaQuery(theme.breakpoints.down("lg"));

  const [open, setOpen] = useState(true);
  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  // set media-wise responsive drawer
  useEffect(() => {
    setOpen(!matchDownLG);
  }, [matchDownLG]);

  return (
    <Box sx={{ display: "flex", width: "100%" }}>
      <Header
        open={open}
        handleDrawerToggle={handleDrawerToggle}
        currentUser={currentUser}
        onLogout={onLogout}
      />
      <Drawer
        open={open}
        handleDrawerToggle={handleDrawerToggle}
        activeMenu={activeMenu}
        onMenuChange={onMenuChange}
        currentUser={currentUser}
        hasPermission={hasPermission}
      />
      <Box
        component="main"
        sx={{ width: "100%", flexGrow: 1, p: { xs: 2, sm: 3 } }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
