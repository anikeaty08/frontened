"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    typeof document !== "undefined" &&
    document.documentElement.dataset.theme === "light"
      ? "light"
      : "dark",
  );
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("aqua-theme", next);
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
