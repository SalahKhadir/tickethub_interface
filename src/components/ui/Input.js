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
        className={`h-11 rounded-xl border border-black/10 bg-white px-4 text-sm text-ink-black placeholder:text-slate-grey focus:border-electric-sapphire focus:outline-none focus:ring-2 focus:ring-electric-sapphire/30 ${className}`}
        {...props}
      />
    </div>
  );
}
