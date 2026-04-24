"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface LayoutContextProps {
  hideNavButtons: boolean;
  setHideNavButtons: (value: boolean) => void;
}

const LayoutContext = createContext<LayoutContextProps | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [hideNavButtons, setHideNavButtons] = useState(false);

  return (
    <LayoutContext.Provider value={{ hideNavButtons, setHideNavButtons }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayoutContext must be used within LayoutProvider");
  }
  return context;
};
