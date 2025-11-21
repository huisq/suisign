// src/components/styles/allowlistStyles.ts

import type React from "react";

// Common typography & layout
export const headerStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: "0.75rem",
  fontSize: "1.25rem",
  fontWeight: 600,
};

export const subtextStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: "1.25rem",
  opacity: 0.9,
  fontSize: "0.9rem",
};

export const inputRowStyle: React.CSSProperties = {
  marginBottom: "1rem",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

export const inputStyle: React.CSSProperties = {
  width: 320,
  height: 36,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.15)",
  padding: "0 10px",
  backgroundColor: "transparent",
  color: "white",
};

export const userListContainer: React.CSSProperties = {
  paddingLeft: "1.2rem",
  marginTop: "0.25rem",
};

export const listRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

export const addrStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "monospace",
  fontSize: 13,
  color: "#cbd5e1",
  wordBreak: "break-all",
};

export const badgeStyle = (active: boolean): React.CSSProperties => ({
  fontSize: 12,
  padding: "2px 10px",
  borderRadius: 12,
  background: active ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.15)",
  color: active ? "#22c55e" : "#94a3b8",
  fontWeight: 600,
  whiteSpace: "nowrap",
});

export const iconButton: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
