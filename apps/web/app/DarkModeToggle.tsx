"use client";
import { useTheme } from "./ThemeProvider";

export function DarkModeToggle({ style }: { style?: React.CSSProperties }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        background: "rgba(255,255,255,0.12)",
        border: "none",
        borderRadius: "8px",
        padding: "6px 10px",
        cursor: "pointer",
        fontSize: "16px",
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
