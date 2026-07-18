import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { eduvyAssets } from "@/config/eduvy-assets";

type AssetMeta = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

interface EduvyIllustrationProps extends Omit<ImageProps, "src" | "alt" | "width" | "height"> {
  asset: AssetMeta;
  priority?: boolean;
  wrapperClassName?: string;
}

export function EduvyIllustration({
  asset,
  className,
  wrapperClassName,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  ...props
}: EduvyIllustrationProps) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <Image
        src={asset.src}
        alt={asset.alt}
        width={asset.width}
        height={asset.height}
        sizes={sizes}
        priority={priority}
        className={cn("h-auto w-full object-contain", className)}
        {...props}
      />
    </div>
  );
}

interface EduvyLogoImageProps {
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "size-8",
  md: "size-9 sm:size-10",
  lg: "size-11 sm:size-12",
};

export function EduvyLogoImage({
  className,
  priority = false,
  size = "md",
}: EduvyLogoImageProps) {
  const { symbol } = eduvyAssets.brand;

  return (
    <Image
      src={symbol.src}
      alt={symbol.alt}
      width={symbol.width}
      height={symbol.height}
      priority={priority}
      className={cn(sizeMap[size], "object-contain", className)}
    />
  );
}
