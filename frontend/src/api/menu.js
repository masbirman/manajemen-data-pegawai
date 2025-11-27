import { useMemo, useState, useCallback } from "react";

// Initial menu state
const initialState = {
  isDashboardDrawerOpened: true,
};

// Global state (simple implementation without Redux)
let menuState = { ...initialState };
let listeners = [];

const notifyListeners = () => {
  listeners.forEach((listener) => listener(menuState));
};

// ==============================|| MENU - API ||============================== //

export const handlerDrawerOpen = (isDashboardDrawerOpened) => {
  menuState = { ...menuState, isDashboardDrawerOpened };
  notifyListeners();
};

export const useGetMenuMaster = () => {
  const [state, setState] = useState(menuState);

  useMemo(() => {
    const listener = (newState) => setState({ ...newState });
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return {
    menuMaster: state,
    menuMasterLoading: false,
  };
};
