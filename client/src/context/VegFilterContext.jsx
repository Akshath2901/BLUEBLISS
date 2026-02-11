import { createContext, useContext, useEffect, useState } from "react";

const VegFilterContext = createContext();

export function VegFilterProvider({ children }) {
  const [isVegOnly, setIsVegOnly] = useState(false);

  const toggleVegOnly = () => {
    setIsVegOnly(prev => !prev);
  };

  // 🔥 Persist preference
  useEffect(() => {
    const saved = localStorage.getItem("vegOnly");
    if (saved === "true") setIsVegOnly(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("vegOnly", isVegOnly);
  }, [isVegOnly]);

  return (
    <VegFilterContext.Provider value={{ isVegOnly, toggleVegOnly }}>
      {children}
    </VegFilterContext.Provider>
  );
}

export const useVegFilter = () => useContext(VegFilterContext);
