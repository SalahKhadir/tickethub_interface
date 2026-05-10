"use client";

const STATUS_CONFIG = {
  NEW:         { blob: "blob-new",        text: "text-new",        label: "New" },
  ACCEPTED:    { blob: "blob-accepted",   text: "text-accepted",   label: "Accepted" },
  IN_PROGRESS: { blob: "blob-inprogress", text: "text-inprogress", label: "In Progress" },
  RESOLVED:    { blob: "blob-resolved",   text: "text-resolved",   label: "Resolved" },
  CLOSED:      { blob: "blob-closed",     text: "text-closed",     label: "Closed" },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status?.toUpperCase()] || STATUS_CONFIG.NEW;
  return (
    <span className="badge-card">
      <span className={`badge-blob ${config.blob}`} />
      <span className="badge-bg" />
      <span className={`badge-label ${config.text}`}>{config.label}</span>
    </span>
  );
}
