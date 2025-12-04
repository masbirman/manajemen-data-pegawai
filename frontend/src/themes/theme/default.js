// ==============================|| PRESET THEME - DEFAULT ||============================== //

export default function Default(mode) {
  const contrastText = '#fff';

  // Modern Indigo/Blue Palette
  let primaryColors = [
    '#eff6ff', // lighter (50)
    '#dbeafe', // 100
    '#bfdbfe', // 200
    '#93c5fd', // light (300)
    '#60a5fa', // 400
    '#2563eb', // main (600) - Vibrant Blue
    '#1d4ed8', // dark (700)
    '#1e40af', // 800
    '#1e3a8a', // darker (900) - Deep Indigo
    '#172554'  // 950
  ];

  // Slate/Gray Palette for Secondary
  let secondaryColors = [
    '#f8fafc', // lighter
    '#f1f5f9',
    '#e2e8f0',
    '#cbd5e1', // light
    '#94a3b8',
    '#64748b', // main (Slate 500)
    '#475569', // dark
    '#334155',
    '#1e293b', // darker
    '#0f172a'
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
