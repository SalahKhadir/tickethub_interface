const baseStyles =
  "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-sapphire/40 disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-electric-sapphire text-bright-snow hover:bg-bright-indigo",
  ghost: "border border-black/10 text-ink-black hover:border-electric-sapphire",
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <button
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
