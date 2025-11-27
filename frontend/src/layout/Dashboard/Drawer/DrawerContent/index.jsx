import PropTypes from "prop-types";

// material-ui
import useMediaQuery from "@mui/material/useMediaQuery";

// project-imports
import Navigation from "./Navigation";
import { useGetMenuMaster } from "../../../../api/menu";
import SimpleBar from "../../../../components/third-party/SimpleBar";

// ==============================|| DRAWER CONTENT ||============================== //

export default function DrawerContent({
  activeMenu,
  onMenuChange,
  currentUser,
  hasPermission,
}) {
  const downLG = useMediaQuery((theme) => theme.breakpoints.down("lg"));

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  return (
    <SimpleBar
      sx={{
        "& .simplebar-content": { display: "flex", flexDirection: "column" },
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
}

DrawerContent.propTypes = {
  activeMenu: PropTypes.string,
  onMenuChange: PropTypes.func,
  currentUser: PropTypes.object,
  hasPermission: PropTypes.func,
};
