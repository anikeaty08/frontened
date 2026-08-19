"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Icon } from "./Icon";

type Theme = "dark" | "light";

const themeEvent = "aqua-theme-change";
const getServerTheme = (): Theme => "dark";
const getTheme = (): Theme =>
  localStorage.getItem("aqua-theme") === "light" ? "light" : "dark";
const subscribe = (onStoreChange: () => void) => {
  window.addEventListener(themeEvent, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(themeEvent, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
};

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("aqua-theme", next);
    window.dispatchEvent(new Event(themeEvent));
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className="aqua-button aqua-button-secondary !h-10 !min-h-10 !w-10 !p-0"
      aria-label={`Use ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <Icon
        icon={theme === "dark" ? "solar:sun-2-linear" : "solar:moon-linear"}
        className="text-lg"
      />
    </button>
  );
}
