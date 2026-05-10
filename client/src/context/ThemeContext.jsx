// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {}, isDark: true });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("bb-theme") || "dark"; }
    catch { return "dark"; }
  });

  useEffect(() => {
    const root = document.documentElement;
    // Add transition class before switching
    root.classList.add("theme-transitioning");
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("bb-theme", theme); } catch {}
    const t = setTimeout(() => root.classList.remove("theme-transitioning"), 400);
    return () => clearTimeout(t);
  }, [theme]);

  const toggleTheme = () => setTheme((p) => (p === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);