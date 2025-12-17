// ==============================|| PRESET THEME - DEFAULT ||============================== //

export default function Default(mode) {
  const contrastText = '#fff';

  // Elegant Deep Blue Palette (Solid, Corporate, Clean)
  let primaryColors = [
    '#eef2ff', // lighter (50) - Very faint blue for backgrounds
    '#e0e7ff', // 100
    '#c7d2fe', // 200
    '#a5b4fc', // light (300)
    '#818cf8', // 400
    '#4f46e5', // main (600) - Indigo 600 (Clean, Sharp)
    '#4338ca', // dark (700)
    '#3730a3', // 800
    '#312e81', // darker (900) - Deep Indigo/Navy
    '#1e1b4b'  // 950
  ];

  // Clean Neutral Grey/Slate Palette for minimal distraction
  let secondaryColors = [
    '#f9fafb', // lighter (Gray 50) - Almost white
    '#f3f4f6', // 100
    '#e5e7eb', // 200
    '#d1d5db', // light (300)
    '#9ca3af', // 400
    '#6b7280', // main (Gray 500)
    '#4b5563', // dark (600)
    '#374151', // 700
    '#1f2937', // darker (800)
    '#111827'  // 900
  ];

  let errorColors = ['#fef2f2', '#fee2e2', '#ef4444', '#b91c1c', '#7f1d1d'];
  let warningColors = ['#fffbeb', '#fef3c7', '#f59e0b', '#b45309', '#78350f'];
  let infoColors = ['#ecfeff', '#cffafe', '#06b6d4', '#0e7490', '#155e75'];
  let successColors = ['#f0fdf4', '#dcfce7', '#10b981', '#047857', '#14532d'];

  return {
    primary: {
      lighter: primaryColors[0],
      100: primaryColors[1],
      200: primaryColors[2],
      light: primaryColors[3],
      400: primaryColors[4],
      main: primaryColors[5],
      dark: primaryColors[6],
      700: primaryColors[7],
      darker: primaryColors[8],
      900: primaryColors[9],
      contrastText
    },
    secondary: {
      lighter: secondaryColors[0],
      100: secondaryColors[1],
      200: secondaryColors[2],
      light: secondaryColors[3],
      400: secondaryColors[4],
      500: secondaryColors[5],
      main: secondaryColors[6],
      dark: secondaryColors[7],
      800: secondaryColors[8],
      darker: secondaryColors[9],
      contrastText
    },
    error: {
      lighter: errorColors[0],
      light: errorColors[1],
      main: errorColors[2],
      dark: errorColors[3],
      darker: errorColors[4],
      contrastText
    },
    warning: {
      lighter: warningColors[0],
      light: warningColors[1],
      main: warningColors[2],
      dark: warningColors[3],
      darker: warningColors[4],
      contrastText
    },
    info: {
      lighter: infoColors[0],
      light: infoColors[1],
      main: infoColors[2],
      dark: infoColors[3],
      darker: infoColors[4],
      contrastText
    },
    success: {
      lighter: successColors[0],
      light: successColors[1],
      main: successColors[2],
      dark: successColors[3],
      darker: successColors[4],
      contrastText
    }
  };
}
