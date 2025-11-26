import { Box } from "@mui/material";
import Navigation from "./Navigation";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

// ==============================|| DRAWER CONTENT ||============================== //

const DrawerContent = ({
  activeMenu,
  onMenuChange,
  currentUser,
  hasPermission,
}) => (
  <SimpleBar
    sx={{
      "& .simplebar-content": {
        display: "flex",
        flexDirection: "column",
      },
    }}
  >
    <Navigation
      activeMenu={activeMenu}
      onMenuChange={onMenuChange}
      currentUser={currentUser}
      hasPermission={hasPermission}
    />
  </SimpleBar>
);

export default DrawerContent;
