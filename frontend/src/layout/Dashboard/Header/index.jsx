import PropTypes from "prop-types";
import { useMemo } from "react";

// material-ui
import { alpha } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";

// project-imports
import AppBarStyled from "./AppBarStyled";
import HeaderContent from "./HeaderContent";

import { handlerDrawerOpen, useGetMenuMaster } from "../../../api/menu";
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from "../../../config";

// ==============================|| MAIN LAYOUT - HEADER ||============================== //

export default function Header({ currentUser, onLogout }) {
  const downLG = useMediaQuery((theme) => theme.breakpoints.down("lg"));

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  // header content
  const headerContent = useMemo(
    () => <HeaderContent currentUser={currentUser} onLogout={onLogout} />,
    [currentUser, onLogout]
  );

  // common header
  const mainHeader = (
    <Toolbar sx={{ px: { xs: 2, sm: 2.5, md: 4.5, lg: 8 } }}>
      <IconButton
        aria-label="open drawer"
        onClick={() => handlerDrawerOpen(!drawerOpen)}
        edge="start"
        sx={{
          color: "secondary.main",
          bgcolor: drawerOpen ? "background.default" : "secondary.200",
          ml: { xs: 0, lg: -2 },
          p: 1,
          "&:hover": { bgcolor: "secondary.200" },
        }}
      >
        <MenuIcon />
      </IconButton>
      {headerContent}
    </Toolbar>
  );

  // app-bar params
  const appBar = {
    position: "fixed",
    elevation: 0,
    sx: (theme) => ({
      bgcolor: alpha(theme.palette.background.default, 0.8),
      backdropFilter: "blur(8px)",
      zIndex: 1200,
      width: {
        xs: "100%",
        lg: drawerOpen
          ? `calc(100% - ${DRAWER_WIDTH}px)`
          : `calc(100% - ${MINI_DRAWER_WIDTH}px)`,
      },
    }),
  };

  return (
    <>
      {!downLG ? (
        <AppBarStyled open={drawerOpen} {...appBar}>
          {mainHeader}
        </AppBarStyled>
      ) : (
        <AppBar {...appBar}>{mainHeader}</AppBar>
      )}
    </>
  );
}

Header.propTypes = {
  currentUser: PropTypes.object,
  onLogout: PropTypes.func,
};
