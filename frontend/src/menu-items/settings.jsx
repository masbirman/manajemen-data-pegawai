import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";

// ==============================|| MENU ITEMS - SETTINGS ||============================== //

const settings = {
  id: "group-settings",
  title: "Settings",
  type: "group",
  children: [
    {
      id: "profile",
      title: "Edit Profil",
      type: "item",
      icon: PersonIcon,
    },
    {
      id: "settings",
      title: "Pengaturan",
      type: "item",
      icon: SettingsIcon,
    },
  ],
};

export default settings;
