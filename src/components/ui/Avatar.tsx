"use client";

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: 40 | 44 | 32;
  className?: string;
};

const sizeMap = { 32: "w-8 h-8 min-w-8", 40: "w-10 h-10 min-w-10", 44: "w-11 h-11 min-w-11" };

export function Avatar({ name, src, size = 40, className = "" }: AvatarProps) {
  const sizeClass = sizeMap[size];
  const pixelSize = size;

  return (
    <div
      className={`rounded-full bg-surface-weak overflow-hidden flex items-center justify-center shrink-0 ${sizeClass} ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={pixelSize} height={pixelSize} className="object-cover w-full h-full" />
      ) : (
        <span className="text-14 font-medium text-text-placeholder">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
