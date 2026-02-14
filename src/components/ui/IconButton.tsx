"use client";

type IconButtonProps = {
  "aria-label": string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
};

export function IconButton({
  "aria-label": ariaLabel,
  onClick,
  children,
  className = "",
  type = "button",
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`
        w-8 h-8 rounded-8 flex items-center justify-center
        outline outline-1 outline-border-primary outline-offset-[-1px]
        bg-surface-default border-none cursor-pointer
        ${className}
      `}
    >
      {children}
    </button>
  );
}
