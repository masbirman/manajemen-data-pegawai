import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PeopleIcon from "@mui/icons-material/People";
import HomeIcon from "@mui/icons-material/Home";

// ==============================|| MENU ITEMS - ADMIN ||============================== //

const admin = {
  id: "group-admin",
  title: "Admin Panel",
  type: "group",
  children: [
    {
      id: "admin",
      title: "Admin Panel",
      type: "item",
      icon: AdminPanelSettingsIcon,
    },
    {
      id: "user-management",
      title: "User Management",
      type: "item",
      icon: PeopleIcon,
    },
    {
      id: "landing-settings",
      title: "Landing Page",
      type: "item",
      icon: HomeIcon,
    },
  ],
};

export default admin;
