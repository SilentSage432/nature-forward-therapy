/** Client-side image studio helpers: transforms, filters, crop, compression. */

export const MAX_COVER_BYTES = 500 * 1024;

export type AspectPreset = "16:9" | "2:1" | "4:3" | "1:1" | "free";

export type AestheticFilter =
  | "normal"
  | "sage"
  | "golden"
  | "mono"
  | "linen";

export type StudioAdjustments = {
  brightness: number; // 0–200, default 100
  contrast: number; // 0–200, default 100
  saturation: number; // 0–200, default 100
  warmth: number; // -100 cool … 100 warm, default 0
  blur: number; // 0–8 px
  vignette: number; // 0–100
};

export type StudioTransform = {
  rotation: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
};

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const DEFAULT_ADJUSTMENTS: StudioAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  blur: 0,
  vignette: 0,
};

export const DEFAULT_TRANSFORM: StudioTransform = {
  rotation: 0,
  flipH: false,
  flipV: false,
};

export const ASPECT_PRESETS: Array<{
  id: AspectPreset;
  label: string;
  ratio: number | null;
}> = [
  { id: "16:9", label: "16:9 (Article Header)", ratio: 16 / 9 },
  { id: "2:1", label: "2:1 (Wide Banner)", ratio: 2 },
  { id: "4:3", label: "4:3 (Standard)", ratio: 4 / 3 },
  { id: "1:1", label: "1:1 (Square)", ratio: 1 },
  { id: "free", label: "Freeform", ratio: null },
];

export const AESTHETIC_PRESETS: Array<{
  id: AestheticFilter;
  label: string;
  description: string;
  adjustments: Partial<StudioAdjustments>;
}> = [
  {
    id: "normal",
    label: "Default / Normal",
    description: "Natural color, no tint",
    adjustments: { ...DEFAULT_ADJUSTMENTS },
  },
  {
    id: "sage",
    label: "Sage Foliage",
    description: "Subtle cool green tone",
    adjustments: {
      brightness: 102,
      contrast: 105,
      saturation: 90,
      warmth: -28,
      vignette: 18,
    },
  },
  {
    id: "golden",
    label: "Golden Hour",
    description: "Warm amber komorebi light",
    adjustments: {
      brightness: 108,
      contrast: 112,
      saturation: 115,
      warmth: 55,
      vignette: 22,
    },
  },
  {
    id: "mono",
    label: "Editorial Monokrome",
    description: "High contrast soft B&W",
    adjustments: {
      brightness: 105,
      contrast: 130,
      saturation: 0,
      warmth: 0,
      vignette: 28,
    },
  },
  {
    id: "linen",
    label: "Linen Paper",
    description: "Soft desaturated parchment",
    adjustments: {
      brightness: 110,
      contrast: 92,
      saturation: 55,
      warmth: 32,
      vignette: 12,
    },
  },
];

export function aspectRatioValue(preset: AspectPreset): number | null {
  return ASPECT_PRESETS.find((p) => p.id === preset)?.ratio ?? null;
}

export function centeredCrop(
  imageWidth: number,
  imageHeight: number,
  aspect: number | null,
): CropRect {
  if (!aspect || aspect <= 0) {
    return { x: 0, y: 0, width: imageWidth, height: imageHeight };
  }

  const imageAspect = imageWidth / imageHeight;
  let width: number;
  let height: number;

  if (imageAspect > aspect) {
    height = imageHeight;
    width = height * aspect;
  } else {
    width = imageWidth;
    height = width / aspect;
  }

  return {
    x: (imageWidth - width) / 2,
    y: (imageHeight - height) / 2,
    width,
    height,
  };
}

export function clampCrop(
  crop: CropRect,
  imageWidth: number,
  imageHeight: number,
  aspect: number | null,
): CropRect {
  let { x, y, width, height } = crop;

  width = Math.max(40, Math.min(width, imageWidth));
  height = Math.max(40, Math.min(height, imageHeight));

  if (aspect && aspect > 0) {
    height = width / aspect;
    if (height > imageHeight) {
      height = imageHeight;
      width = height * aspect;
    }
    if (width > imageWidth) {
      width = imageWidth;
      height = width / aspect;
    }
  }

  x = Math.min(Math.max(0, x), Math.max(0, imageWidth - width));
  y = Math.min(Math.max(0, y), Math.max(0, imageHeight - height));

  return { x, y, width, height };
}

export function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:") && !src.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Unable to load image. Try uploading a local file."));
    img.src = src;
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

function dataUrlByteLength(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}

/**
 * Draw source with transform, crop, adjustments onto an output canvas.
 */
export function renderStudioCanvas(
  source: HTMLImageElement,
  crop: CropRect,
  transform: StudioTransform,
  adjustments: StudioAdjustments,
  maxEdge = 1600,
): HTMLCanvasElement {
  const out = document.createElement("canvas");
  const rotated = transform.rotation === 90 || transform.rotation === 270;
  const cropW = Math.max(1, Math.round(crop.width));
  const cropH = Math.max(1, Math.round(crop.height));
  let outW = rotated ? cropH : cropW;
  let outH = rotated ? cropW : cropH;

  const scale = Math.min(1, maxEdge / Math.max(outW, outH));
  outW = Math.max(1, Math.round(outW * scale));
  outH = Math.max(1, Math.round(outH * scale));
  out.width = outW;
  out.height = outH;

  const ctx = out.getContext("2d");
  if (!ctx) return out;

  ctx.save();
  ctx.translate(outW / 2, outH / 2);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.scale(transform.flipH ? -1 : 1, transform.flipV ? -1 : 1);

  const drawW = rotated ? outH : outW;
  const drawH = rotated ? outW : outH;

  const filterParts = [
    `brightness(${adjustments.brightness}%)`,
    `contrast(${adjustments.contrast}%)`,
    `saturate(${adjustments.saturation}%)`,
  ];
  if (adjustments.blur > 0) {
    filterParts.push(`blur(${adjustments.blur}px)`);
  }
  ctx.filter = filterParts.join(" ");

  ctx.drawImage(
    source,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    -drawW / 2,
    -drawH / 2,
    drawW,
    drawH,
  );
  ctx.restore();

  // Warmth tint overlay
  if (adjustments.warmth !== 0) {
    ctx.save();
    const amount = Math.min(100, Math.abs(adjustments.warmth)) / 100;
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle =
      adjustments.warmth > 0
        ? `rgba(212, 160, 60, ${0.35 * amount})`
        : `rgba(80, 130, 180, ${0.35 * amount})`;
    ctx.fillRect(0, 0, outW, outH);
    ctx.restore();
  }

  // Soft vignette
  if (adjustments.vignette > 0) {
    ctx.save();
    const strength = adjustments.vignette / 100;
    const gradient = ctx.createRadialGradient(
      outW / 2,
      outH / 2,
      Math.min(outW, outH) * 0.25,
      outW / 2,
      outH / 2,
      Math.max(outW, outH) * 0.72,
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, `rgba(0,0,0,${0.55 * strength})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, outW, outH);
    ctx.restore();
  }

  return out;
}

export async function compressCanvasToDataUrl(
  canvas: HTMLCanvasElement,
  maxBytes = MAX_COVER_BYTES,
): Promise<string> {
  const tryEncode = (type: string, quality: number) =>
    canvas.toDataURL(type, quality);

  let type = "image/webp";
  let quality = 0.9;
  let dataUrl = tryEncode(type, quality);

  // Safari may not support webp encoding well — fall back early if huge/empty
  if (!dataUrl.startsWith("data:image/webp")) {
    type = "image/jpeg";
    dataUrl = tryEncode(type, quality);
  }

  while (dataUrlByteLength(dataUrl) > maxBytes && quality > 0.35) {
    quality -= 0.08;
    dataUrl = tryEncode(type, quality);
  }

  if (dataUrlByteLength(dataUrl) > maxBytes && type === "image/webp") {
    type = "image/jpeg";
    quality = 0.85;
    dataUrl = tryEncode(type, quality);
    while (dataUrlByteLength(dataUrl) > maxBytes && quality > 0.3) {
      quality -= 0.08;
      dataUrl = tryEncode(type, quality);
    }
  }

  // Last resort: shrink canvas dimensions
  if (dataUrlByteLength(dataUrl) > maxBytes) {
    const smaller = document.createElement("canvas");
    const scale = 0.75;
    smaller.width = Math.max(1, Math.round(canvas.width * scale));
    smaller.height = Math.max(1, Math.round(canvas.height * scale));
    const sctx = smaller.getContext("2d");
    if (sctx) {
      sctx.drawImage(canvas, 0, 0, smaller.width, smaller.height);
      return compressCanvasToDataUrl(smaller, maxBytes);
    }
  }

  return dataUrl;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function dataUrlSizeLabel(dataUrl: string): string {
  return formatBytes(dataUrlByteLength(dataUrl));
}
