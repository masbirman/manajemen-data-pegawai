import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PeopleIcon from "@mui/icons-material/People";
import HomeIcon from "@mui/icons-material/Home";
import BuildIcon from "@mui/icons-material/Build";

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
    {
      id: "maintenance",
      title: "Maintenance",
      type: "item",
      icon: BuildIcon,
    },
  ],
};

export default admin;
