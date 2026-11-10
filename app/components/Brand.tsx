import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  className?: string;
};

export function BrandMark() {
  return (
    <span className="brand-mark">
      <Image src="/ikamva-mark.png" alt="" width={108} height={108} />
    </span>
  );
}

export default function Brand({ className = "" }: BrandProps) {
  return (
    <Link
      href="/"
      className={`brand ${className}`.trim()}
      aria-label="iKamva Coding Institute home"
    >
      <span className="brand-compact">
        <BrandMark />
        <span>
          iKamva<span className="brand-muted"> coding institute</span>
        </span>
      </span>
      <Image
        src="/ikamva-logo.png"
        alt="iKamva Coding Institute"
        width={768}
        height={768}
        className="brand-full-logo"
        loading="eager"
      />
    </Link>
  );
}
