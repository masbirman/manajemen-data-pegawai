import DashboardIcon from "@mui/icons-material/Dashboard";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ArchiveIcon from "@mui/icons-material/Archive";

// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const dashboard = (hasPermission) => ({
  id: "group-dashboard",
  title: "Navigation",
  type: "group",
  children: [
    {
      id: "dashboard",
      title: "Dashboard",
      type: "item",
      icon: DashboardIcon,
      disabled: !hasPermission("dashboard"),
    },
    {
      id: "comparison",
      title: "Perbandingan Data",
      type: "item",
      icon: CompareArrowsIcon,
      disabled: !hasPermission("compare"),
    },
    {
      id: "upload",
      title: "Upload Data",
      type: "item",
      icon: CloudUploadIcon,
      disabled: !hasPermission("upload"),
    },
    {
      id: "archive",
      title: "Arsip Data",
      type: "item",
      icon: ArchiveIcon,
      disabled: !hasPermission("archive"),
    },
  ],
});

export default dashboard;
