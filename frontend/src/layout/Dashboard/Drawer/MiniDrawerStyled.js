// material-ui
import { styled } from "@mui/material/styles";
import Drawer from "@mui/material/Drawer";

// project-imports
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from "../../../config";

const openedMixin = (theme) => ({
  backgroundColor: theme.palette.primary.darker, // Use theme Navy
  color: "#ffffff", // White text
  width: DRAWER_WIDTH,
  borderRight: "none", // Remove dashed border
  boxShadow: "none", // clean flat look

  overflowX: "hidden",

  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
});

const closedMixin = (theme) => ({
  overflow: "hidden",
  backgroundColor: theme.palette.primary.darker, // Use theme Navy
  color: "#ffffff", // White text

  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),

  overflowX: "hidden",
  width: MINI_DRAWER_WIDTH,
  borderRight: "none",
  boxShadow: theme.customShadows.z1,
});

// ==============================|| DRAWER - MINI STYLED ||============================== //

const MiniDrawerStyled = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

export default MiniDrawerStyled;
