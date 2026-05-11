const baseStyles =
  "inline-flex items-center justify-center rounded-[10px] text-sm font-medium transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary:
    "bg-electric-sapphire text-bright-snow hover:bg-bright-indigo px-5 py-[10px] shadow-sm shadow-electric-sapphire/10",
  ghost:
    "bg-transparent border border-electric-sapphire text-electric-sapphire hover:bg-bright-snow px-5 py-[10px]",
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
