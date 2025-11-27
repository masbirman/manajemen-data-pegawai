// ==============================|| DEFAULT THEME - TYPOGRAPHY ||============================== //

export default function Typography(fontFamily, fontScale = 1) {
  const scale = (size) => `${parseFloat(size) * fontScale}rem`;

  return {
    htmlFontSize: 16,
    fontFamily,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: {
      fontWeight: 600,
      fontSize: scale(2.375),
      lineHeight: 1.21,
    },
    h2: {
      fontWeight: 600,
      fontSize: scale(1.875),
      lineHeight: 1.27,
    },
    h3: {
      fontWeight: 600,
      fontSize: scale(1.5),
      lineHeight: 1.33,
    },
    h4: {
      fontWeight: 600,
      fontSize: scale(1.25),
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: scale(1),
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 400,
      fontSize: scale(0.875),
      lineHeight: 1.57,
    },
    caption: {
      fontWeight: 400,
      fontSize: scale(0.75),
      lineHeight: 1.66,
    },
    body1: {
      fontSize: scale(0.875),
      lineHeight: 1.57,
    },
    body2: {
      fontSize: scale(0.75),
      lineHeight: 1.66,
    },
    subtitle1: {
      fontSize: scale(0.875),
      fontWeight: 600,
      lineHeight: 1.57,
    },
    subtitle2: {
      fontSize: scale(0.75),
      fontWeight: 500,
      lineHeight: 1.66,
    },
    overline: {
      lineHeight: 1.66,
    },
    button: {
      textTransform: "capitalize",
    },
  };
}
