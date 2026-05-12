export const formatSLA = (deadline, status, updatedAt) => {
  if (!deadline) return { label: "—", overdue: false };

  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) return { label: "—", overdue: false };

  const isResolved = status === "RESOLVED" || status === "CLOSED";
  // If resolved, compare deadline with resolution time (updatedAt)
  // Otherwise, compare with current time
  const compareTime = isResolved && updatedAt ? new Date(updatedAt).getTime() : Date.now();
  
  const diff = deadlineDate.getTime() - compareTime;
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);

  if (isResolved) {
    return diff >= 0
      ? { label: "Met SLA", overdue: false, status: "met" }
      : { label: `Missed (${h}h ${m}m)`, overdue: true, status: "missed" };
  }

  return diff > 0
    ? { label: `${h}h ${m}m left`, overdue: false }
    : { label: `${h}h ${m}m overdue`, overdue: true };
};
