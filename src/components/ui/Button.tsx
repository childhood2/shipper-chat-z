"use client";

type ButtonProps = {
  type?: "button" | "submit";
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
};

export function Button({
  type = "button",
  onClick,
  children,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-1.5 text-14 font-medium border-none cursor-pointer whitespace-nowrap";

  if (variant === "ghost") {
    return (
      <button type={type} onClick={onClick} className={`${base} ${className}`.trim()}>
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} p-2 rounded-8 text-icon-white bg-brand outline outline-1 outline-brand outline-offset-[-1px] shadow-[0px_1px_0px_1px_rgba(255,255,255,0.12)_inset] bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_100%),var(--semantic-brand-500)] ${className}`.trim()}
    >
      {children}
    </button>
  );
}
