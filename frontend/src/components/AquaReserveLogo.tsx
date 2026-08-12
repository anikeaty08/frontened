import Image from "next/image";

type AquaReserveLogoProps = {
  size?: number;
  className?: string;
};

export default function AquaReserveLogo({ size = 28, className = "" }: AquaReserveLogoProps) {
  return (
    <Image
      aria-label="AquaReserve"
      className={className}
      height={size}
      width={size}
      priority
      src="/aquareserve-icon.png"
      alt="AquaReserve logo"
    />
  );
}
