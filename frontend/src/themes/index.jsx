import PropTypes from "prop-types";
import { useMemo } from "react";

// material-ui
import {
  createTheme,
  ThemeProvider,
  StyledEngineProvider,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// project-imports
import Palette from "./palette";
import Typography from "./typography";
import CustomShadows from "./shadows";
import componentsOverride from "./overrides";
import { useSettings } from "../contexts/SettingsContext";

import { HEADER_HEIGHT } from "../config";

// Font mapping
const FONTS = {
  inter: '"Inter", sans-serif',
  jakarta: '"Plus Jakarta Sans", sans-serif',
  poppins: '"Poppins", sans-serif',
};

// ==============================|| DEFAULT THEME - MAIN ||============================== //

export default function ThemeCustomization({ children }) {
  const { settings } = useSettings();

  const mode = settings.darkMode ? "dark" : "light";
  const fontFamily = FONTS[settings.selectedFont] || FONTS.inter;
  const fontScale = (settings.fontSize || 100) / 100;

  const theme = Palette(mode, "default");
  const themeTypography = Typography(fontFamily, fontScale);
  const themeCustomShadows = useMemo(() => CustomShadows(theme), [theme]);

  const themeOptions = useMemo(
    () => ({
      breakpoints: {
        values: {
          xs: 0,
          sm: 768,
          md: 1024,
          lg: 1266,
          xl: 1440,
        },
      },
      direction: "ltr",
      mixins: {
        toolbar: {
          minHeight: HEADER_HEIGHT,
          paddingTop: 8,
          paddingBottom: 8,
        },
      },
      palette: theme.palette,
      shape: {
        borderRadius: 8,
      },
      customShadows: themeCustomShadows,
      typography: themeTypography,
    }),
    [theme, themeTypography, themeCustomShadows]
  );

  const themes = createTheme(themeOptions);
  themes.components = componentsOverride(themes);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={themes}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

ThemeCustomization.propTypes = { children: PropTypes.node };
