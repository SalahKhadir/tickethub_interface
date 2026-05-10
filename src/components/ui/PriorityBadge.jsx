"use client";

const PRIORITY_CONFIG = {
  CRITICAL: { blob: "blob-critical", text: "text-critical", label: "Critical" },
  HIGH:     { blob: "blob-high",     text: "text-high",     label: "High" },
  MEDIUM:   { blob: "blob-medium",   text: "text-medium",   label: "Medium" },
  LOW:      { blob: "blob-low",      text: "text-low",      label: "Low" },
};

export default function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority?.toUpperCase()] || PRIORITY_CONFIG.LOW;
  return (
    <span className="badge-card">
      <span className={`badge-blob ${config.blob}`} />
      <span className="badge-bg" />
      <span className={`badge-label ${config.text}`}>{config.label}</span>
    </span>
  );
}
