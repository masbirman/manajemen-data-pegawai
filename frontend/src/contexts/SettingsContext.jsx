import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const defaultSettings = {
  themeColor: "blue",
  accentColor: "blue",
  selectedFont: "inter",
  fontSize: 100,
  darkMode: false,
  sidebarWidth: "normal",
  contentSpacing: "normal",
};

const SettingsContext = createContext({
  settings: defaultSettings,
  updateSettings: () => {},
  resetSettings: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    // Load from localStorage first
    const saved = localStorage.getItem("appSettings");
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings;
  });

  // Load settings from API on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/app-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            const newSettings = { ...defaultSettings, ...data.settings };
            setSettings(newSettings);
            localStorage.setItem("appSettings", JSON.stringify(newSettings));
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };

    loadSettings();

    // Listen for settings updates
    const handleSettingsUpdate = () => loadSettings();
    window.addEventListener("globalSettingsUpdated", handleSettingsUpdate);

    return () => {
      window.removeEventListener("globalSettingsUpdated", handleSettingsUpdate);
    };
  }, []);

  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("appSettings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.setItem("appSettings", JSON.stringify(defaultSettings));
  }, []);

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, resetSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export default SettingsContext;
