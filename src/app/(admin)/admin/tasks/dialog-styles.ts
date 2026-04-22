// Shared dialog styles for admin task dialogs

export const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "44px",
  backgroundColor: "rgba(255,255,255,0.6)",
  border: "1px solid #dddddd",
  borderRadius: "9999px",
  padding: "0 16px",
  fontSize: "13px",
  fontWeight: 500,
  color: "#1a1a1a",
  outline: "none",
  backdropFilter: "blur(8px)",
};

export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23707070' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  paddingRight: "36px",
  borderRadius: "9999px",
};

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: "#737373",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  marginBottom: "6px",
};

export function handleFocus(
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) {
  e.currentTarget.style.borderColor = "#0a0a0a";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.06)";
  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.85)";
}

export function handleBlur(
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) {
  e.currentTarget.style.borderColor = "#dddddd";
  e.currentTarget.style.boxShadow = "none";
  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.6)";
}
