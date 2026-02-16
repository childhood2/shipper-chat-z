"use client";

type SlideActionButtonProps = {
  label: string;
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
};

export function SlideActionButton({ label, icon, onClick, className = "" }: SlideActionButtonProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(e as unknown as React.MouseEvent);
        }
      }}
      className={`
        w-16 min-w-16 min-h-16 self-stretch p-3 rounded-12
        flex flex-col items-center justify-center
        shrink-0 cursor-pointer box-border
        bg-brand text-icon-white
        text-[12px] font-medium
        ${className}
      `}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
