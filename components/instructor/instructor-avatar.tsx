import Image from "next/image";

type Props = {
  name: string;
  /** Lokal avatar yolu (public/images/instructors/x.jpg). Yoksa initials. */
  avatarSrc?: string;
  size?: number;
  className?: string;
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Eğitmen mini avatar — yuvarlak, çerçevesiz, tıklanmaz.
 * Lokal foto varsa onu gösterir (yüksek çözünürlüklü IG profil ss),
 * yoksa walnut-dark zemin + krema initials.
 */
export function InstructorAvatar({
  name,
  avatarSrc,
  size = 56,
  className,
}: Props) {
  const initials = initialsOf(name);

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-full ${className ?? ""}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: "var(--color-walnut-dark)",
        color: "var(--color-background)",
      }}
      aria-label={`Eğitmen ${name}`}
    >
      {avatarSrc ? (
        <Image
          src={avatarSrc}
          alt={name}
          width={size}
          height={size}
          sizes={`${size}px`}
          quality={90}
          className="object-cover w-full h-full"
        />
      ) : (
        <span className="text-[11px] tracking-[0.15em] font-medium">
          {initials}
        </span>
      )}
    </div>
  );
}
