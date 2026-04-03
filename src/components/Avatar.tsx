import Image from "next/image";

interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-20 w-20 text-2xl" };
const sizePx = { sm: 32, md: 40, lg: 80 };

export function Avatar({ src, name, size = "md" }: AvatarProps) {
  return src ? (
    <Image
      src={src}
      alt={name}
      width={sizePx[size]}
      height={sizePx[size]}
      className={`${sizeClasses[size]} rounded-full object-cover`}
    />
  ) : (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-wine-600 font-bold text-white`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
