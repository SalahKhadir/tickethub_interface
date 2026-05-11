export default function Input({ label, id, className = "", ...props }) {
  const inputId = id || props.name;

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-black">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`h-11 rounded-[10px] border border-[rgba(17,24,39,0.12)] bg-white px-4 text-sm text-ink-black placeholder:text-slate-grey shadow-sm shadow-black/5 focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.15)] ${className}`}
        {...props}
      />
    </div>
  );
}
