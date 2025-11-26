import dashboard from "./dashboard";
import admin from "./admin";
import settings from "./settings";

// ==============================|| MENU ITEMS ||============================== //

const menuItems = (currentUser, hasPermission) => {
  const items = [dashboard(hasPermission)];

  // Add admin menu only for superadmin
  if (currentUser?.role === "superadmin") {
    items.push(admin);
    items.push(settings);
  }

  return { items };
};

export default menuItems;
