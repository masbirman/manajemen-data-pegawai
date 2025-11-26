import { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Toolbar, useMediaQuery } from "@mui/material";

// project import
import Drawer from "./Drawer";
import Header from "./Header";

// ==============================|| MAIN LAYOUT - ABLE PRO STYLE ||============================== //

const MainLayout = ({
  children,
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
    <Box sx={{ display: "flex", width: "100%", minHeight: "100vh" }}>
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
        sx={{
          width: open ? "calc(100% - 260px)" : "100%",
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          bgcolor: "#f5f7fa",
          minHeight: "100vh",
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
