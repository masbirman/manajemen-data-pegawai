import PropTypes from "prop-types";

// project-imports
import getColors from "../../utils/getColors";

// ==============================|| CHECKBOX - COLORS ||============================== //

function getColorStyle({ color, theme }) {
  const colors = getColors(theme, color);
  const { lighter, main, dark } = colors;

  return {
    "&:hover": {
      backgroundColor: color === "secondary" ? lighter : lighter + 50,
    },
    "&.Mui-focusVisible": {
      outline: `2px solid ${dark}`,
      outlineOffset: -4,
    },
  };
}

// ==============================|| OVERRIDES - CHECKBOX ||============================== //

export default function Checkbox(theme) {
  const { palette } = theme;

  return {
    MuiCheckbox: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          color: palette.secondary[300],
        },
        colorPrimary: getColorStyle({ color: "primary", theme }),
        colorSecondary: getColorStyle({ color: "secondary", theme }),
        colorSuccess: getColorStyle({ color: "success", theme }),
        colorWarning: getColorStyle({ color: "warning", theme }),
        colorInfo: getColorStyle({ color: "info", theme }),
        colorError: getColorStyle({ color: "error", theme }),
      },
    },
  };
}

getColorStyle.propTypes = { color: PropTypes.any, theme: PropTypes.any };
