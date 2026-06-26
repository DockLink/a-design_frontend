import { cn } from "@/lib/utils";

export function TaskUserAvatar({
  initials,
  size = 22,
  className,
}: {
  initials: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full bg-[#F5E6D0] font-semibold text-[#D4A96A]", className)}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.floor(size * 0.38)) }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}
