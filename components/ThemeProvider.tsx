"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  dark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  dark: true,
  toggleTheme: () => {},
});

const STORAGE_KEY = "dalis-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default is dark (true) — matches the original behaviour for a
  // brand-new visitor who has no saved preference yet.
  const [dark, setDark] = useState(true);

  // On mount, read back whatever the user last chose. This runs once,
  // client-side only (localStorage isn't available during SSR), and
  // overrides the `true` default if a saved value exists. This is what
  // makes the choice survive a full page reload / fresh visit to Home,
  // instead of always restarting at dark.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light") {
      setDark(false);
    } else if (saved === "dark") {
      setDark(true);
    }
    // If nothing saved yet, leave the default (dark) as-is.
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", dark);
  }, [dark]);

  const toggleTheme = () => {
    setDark((prev) => {
      const next = !prev;
      // Persist immediately so it's there the next time ThemeProvider
      // mounts, whether that's a client navigation or a hard reload.
      window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);