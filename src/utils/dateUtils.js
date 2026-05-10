export const formatSLA = (deadline) => {
  if (!deadline) return "—";
  const diff = new Date(deadline).getTime() - Date.now();
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  return diff > 0
    ? { label: `${h}h ${m}m remaining`, overdue: false }
    : { label: `${h}h ${m}m overdue`, overdue: true };
};
