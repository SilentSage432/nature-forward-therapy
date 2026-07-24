"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  FlipHorizontal2,
  FlipVertical2,
  Loader2,
  RotateCcw,
  RotateCw,
  Sparkles,
  X,
} from "lucide-react";
import {
  AESTHETIC_PRESETS,
  ASPECT_PRESETS,
  DEFAULT_ADJUSTMENTS,
  DEFAULT_TRANSFORM,
  aspectRatioValue,
  centeredCrop,
  clampCrop,
  compressCanvasToDataUrl,
  dataUrlSizeLabel,
  loadImageFromSrc,
  renderStudioCanvas,
  type AestheticFilter,
  type AspectPreset,
  type CropRect,
  type StudioAdjustments,
  type StudioTransform,
} from "@/lib/image-studio";

type StudioTab = "edit" | "ai";

type ImageEditorModalProps = {
  open: boolean;
  sourceSrc: string | null;
  essayTitle?: string;
  onClose: () => void;
  onApply: (dataUrl: string) => void;
};

type DragMode = "move" | "resize-se" | null;

export function ImageEditorModal({
  open,
  sourceSrc,
  essayTitle = "",
  onClose,
  onApply,
}: ImageEditorModalProps) {
  const [tab, setTab] = useState<StudioTab>("edit");
  const [workingSrc, setWorkingSrc] = useState<string | null>(sourceSrc);
  const [originalSrc, setOriginalSrc] = useState<string | null>(sourceSrc);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aspect, setAspect] = useState<AspectPreset>("16:9");
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [adjustments, setAdjustments] =
    useState<StudioAdjustments>(DEFAULT_ADJUSTMENTS);
  const [transform, setTransform] =
    useState<StudioTransform>(DEFAULT_TRANSFORM);
  const [aesthetic, setAesthetic] = useState<AestheticFilter>("normal");
  const [aiPrompt, setAiPrompt] = useState(
    essayTitle
      ? `A tranquil nature scene that evokes “${essayTitle}”, soft golden light through leaves`
      : "A tranquil, sunlit forest path with soft golden komorebi light filtering through leaves",
  );
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [applyPending, setApplyPending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<string>("");

  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragMode = useRef<DragMode>(null);
  const dragOrigin = useRef({ x: 0, y: 0, crop: null as CropRect | null });

  useEffect(() => {
    if (!open) return;
    setWorkingSrc(sourceSrc);
    setOriginalSrc(sourceSrc);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setTransform(DEFAULT_TRANSFORM);
    setAesthetic("normal");
    setAspect("16:9");
    setLoadError(null);
    if (!sourceSrc) {
      setImage(null);
      setCrop(null);
      setTab("ai");
    } else {
      setTab("edit");
    }
  }, [open, sourceSrc]);

  useEffect(() => {
    if (!open || !workingSrc) return;
    let cancelled = false;
    void loadImageFromSrc(workingSrc)
      .then((img) => {
        if (cancelled) return;
        setImage(img);
        setCrop(
          centeredCrop(img.naturalWidth, img.naturalHeight, aspectRatioValue("16:9")),
        );
        setLoadError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setImage(null);
        setCrop(null);
        setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [open, workingSrc]);

  useEffect(() => {
    if (!image || !crop) {
      setPreviewUrl(null);
      return;
    }
    const canvas = renderStudioCanvas(image, crop, transform, adjustments, 720);
    const url = canvas.toDataURL("image/jpeg", 0.82);
    setPreviewUrl(url);
    setPreviewSize(dataUrlSizeLabel(url));
  }, [image, crop, transform, adjustments]);

  const liveFilter = [
    `brightness(${adjustments.brightness}%)`,
    `contrast(${adjustments.contrast}%)`,
    `saturate(${adjustments.saturation}%)`,
    adjustments.blur > 0 ? `blur(${adjustments.blur}px)` : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  function resetChanges() {
    if (!originalSrc) return;
    setWorkingSrc(originalSrc);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setTransform(DEFAULT_TRANSFORM);
    setAesthetic("normal");
    setAspect("16:9");
  }

  function applyAesthetic(id: AestheticFilter) {
    const preset = AESTHETIC_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setAesthetic(id);
    setAdjustments({ ...DEFAULT_ADJUSTMENTS, ...preset.adjustments });
  }

  function setAspectPreset(next: AspectPreset) {
    setAspect(next);
    if (!image) return;
    const ratio = aspectRatioValue(next);
    setCrop(centeredCrop(image.naturalWidth, image.naturalHeight, ratio));
  }

  function rotate(delta: 90 | -90) {
    setTransform((prev) => {
      const next = (((prev.rotation + delta) % 360) + 360) % 360;
      return { ...prev, rotation: next as StudioTransform["rotation"] };
    });
  }

  function onCropPointerDown(
    event: ReactPointerEvent,
    mode: Exclude<DragMode, null>,
  ) {
    if (!crop) return;
    event.preventDefault();
    event.stopPropagation();
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    dragMode.current = mode;
    dragOrigin.current = {
      x: event.clientX,
      y: event.clientY,
      crop: { ...crop },
    };
  }

  function onStagePointerMove(event: ReactPointerEvent) {
    if (!dragMode.current || !dragOrigin.current.crop || !image || !imageRef.current) {
      return;
    }
    const bounds = imageRef.current.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    const scaleX = image.naturalWidth / bounds.width;
    const scaleY = image.naturalHeight / bounds.height;
    const dx = (event.clientX - dragOrigin.current.x) * scaleX;
    const dy = (event.clientY - dragOrigin.current.y) * scaleY;
    const start = dragOrigin.current.crop;
    const ratio = aspectRatioValue(aspect);

    if (dragMode.current === "move") {
      setCrop(
        clampCrop(
          {
            ...start,
            x: start.x + dx,
            y: start.y + dy,
          },
          image.naturalWidth,
          image.naturalHeight,
          ratio,
        ),
      );
      return;
    }

    setCrop(
      clampCrop(
        {
          ...start,
          width: start.width + dx,
          height: start.height + dy,
        },
        image.naturalWidth,
        image.naturalHeight,
        ratio,
      ),
    );
  }

  function onStagePointerUp() {
    dragMode.current = null;
  }

  async function generateAiCover() {
    setAiError(null);
    setAiPending(true);
    try {
      const res = await fetch("/api/cms/generate-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        imageDataUrl?: string;
      } | null;
      if (!res.ok || !data?.imageDataUrl) {
        setAiError(data?.error ?? "Generation failed. Please try again.");
        return;
      }
      setWorkingSrc(data.imageDataUrl);
      setOriginalSrc(data.imageDataUrl);
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setTransform(DEFAULT_TRANSFORM);
      setAesthetic("normal");
      setAspect("16:9");
      setTab("edit");
    } catch {
      setAiError("Generation failed. Please try again.");
    } finally {
      setAiPending(false);
    }
  }

  async function applyAndSave() {
    if (!image || !crop) return;
    setApplyPending(true);
    try {
      const canvas = renderStudioCanvas(image, crop, transform, adjustments, 1600);
      const dataUrl = await compressCanvasToDataUrl(canvas);
      onApply(dataUrl);
      onClose();
    } finally {
      setApplyPending(false);
    }
  }

  const cropStyle =
    image && crop
      ? {
          left: `${(crop.x / image.naturalWidth) * 100}%`,
          top: `${(crop.y / image.naturalHeight) * 100}%`,
          width: `${(crop.width / image.naturalWidth) * 100}%`,
          height: `${(crop.height / image.naturalHeight) * 100}%`,
        }
      : undefined;

  return (
    <div className="fixed inset-0 z-[90] flex items-stretch justify-center bg-forest/90 p-3 backdrop-blur-sm sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-studio-title"
        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gold/30 bg-forest-soft shadow-2xl sm:max-h-[calc(100vh-3rem)]"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-sage-dark/40 px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-semibold tracking-wide text-gold uppercase">
              Cover Studio
            </p>
            <h2
              id="image-studio-title"
              className="font-heading text-xl font-bold text-white sm:text-2xl"
            >
              Photo Editor &amp; Botanical Studio
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sage-dark/40 text-sage-light transition hover:border-gold hover:text-gold"
            aria-label="Close studio"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex gap-2 border-b border-sage-dark/30 px-4 py-2 sm:px-6">
          <button
            type="button"
            onClick={() => setTab("edit")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === "edit"
                ? "bg-gold/15 text-gold"
                : "text-sage-light hover:text-gold"
            }`}
          >
            Edit &amp; Crop
          </button>
          <button
            type="button"
            onClick={() => setTab("ai")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === "ai"
                ? "bg-gold/15 text-gold"
                : "text-sage-light hover:text-gold"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            AI Botanical Cover Generator
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {tab === "ai" ? (
            <div className="mx-auto max-w-2xl space-y-4">
              <p className="text-sm leading-relaxed text-sage-light">
                Describe a nature scene and Gemini will generate a unique 16:9
                cover for this essay. You can refine it in the editor afterward.
              </p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
                placeholder="A tranquil, sunlit forest path with soft golden komorebi light filtering through leaves"
              />
              {aiError ? (
                <p
                  role="alert"
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  {aiError}
                </p>
              ) : null}
              <button
                type="button"
                disabled={aiPending || aiPrompt.trim().length < 8}
                onClick={() => void generateAiCover()}
                className="btn-gold inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-heading text-sm font-semibold disabled:opacity-60"
              >
                {aiPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating cover…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Botanical Cover
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
              <div className="space-y-3">
                {loadError ? (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                  >
                    {loadError}
                  </p>
                ) : null}
                {!workingSrc ? (
                  <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-sage-dark/40 bg-forest/60 p-6 text-center text-sm text-sage-light">
                    Upload an image or generate one with the AI Botanical Cover
                    Generator to begin editing.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      ref={stageRef}
                      className="flex justify-center overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 p-2"
                      onPointerMove={onStagePointerMove}
                      onPointerUp={onStagePointerUp}
                      onPointerLeave={onStagePointerUp}
                    >
                      <div className="relative inline-block max-w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          ref={imageRef}
                          src={workingSrc}
                          alt="Cover source"
                          className="block max-h-[46vh] max-w-full"
                          style={{ filter: liveFilter }}
                          draggable={false}
                        />
                        {image && crop ? (
                          <div className="pointer-events-none absolute inset-0">
                            <div
                              className="pointer-events-auto absolute border-2 border-gold shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                              style={cropStyle}
                              onPointerDown={(e) =>
                                onCropPointerDown(e, "move")
                              }
                            >
                              <span className="absolute top-1 left-1 rounded bg-forest/80 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-gold uppercase">
                                Crop
                              </span>
                              <button
                                type="button"
                                aria-label="Resize crop"
                                className="absolute right-0 bottom-0 h-4 w-4 translate-x-1/2 translate-y-1/2 rounded-sm border border-gold bg-gold"
                                onPointerDown={(e) =>
                                  onCropPointerDown(e, "resize-se")
                                }
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {previewUrl ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold tracking-wide text-gold uppercase">
                          Final preview
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Edited cover preview"
                          className="max-h-36 w-full rounded-xl border border-stone-800 object-contain"
                        />
                      </div>
                    ) : null}
                  </div>
                )}
                {previewSize ? (
                  <p className="text-xs text-sage-dark">
                    Preview export estimate ≈ {previewSize} (final compresses
                    under 500KB)
                  </p>
                ) : null}
              </div>

              <div className="space-y-5">
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-gold">
                    Aspect ratio &amp; crop
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {ASPECT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAspectPreset(preset.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          aspect === preset.id
                            ? "border-gold/60 bg-gold/15 text-gold"
                            : "border-sage-dark/40 text-sage-light hover:border-gold/40 hover:text-gold"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-semibold text-gold">
                    Nature-forward filters
                  </h3>
                  <div className="space-y-2">
                    {AESTHETIC_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyAesthetic(preset.id)}
                        className={`flex w-full flex-col rounded-xl border px-3 py-2 text-left transition ${
                          aesthetic === preset.id
                            ? "border-gold/50 bg-gold/10"
                            : "border-sage-dark/40 hover:border-gold/30"
                        }`}
                      >
                        <span className="text-sm font-medium text-parchment">
                          {preset.label}
                        </span>
                        <span className="text-xs text-sage-dark">
                          {preset.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gold">
                    Visual adjustments
                  </h3>
                  <SliderField
                    label="Brightness"
                    value={adjustments.brightness}
                    min={0}
                    max={200}
                    onChange={(brightness) =>
                      setAdjustments((prev) => ({ ...prev, brightness }))
                    }
                  />
                  <SliderField
                    label="Contrast"
                    value={adjustments.contrast}
                    min={0}
                    max={200}
                    onChange={(contrast) =>
                      setAdjustments((prev) => ({ ...prev, contrast }))
                    }
                  />
                  <SliderField
                    label="Saturation"
                    value={adjustments.saturation}
                    min={0}
                    max={200}
                    onChange={(saturation) =>
                      setAdjustments((prev) => ({ ...prev, saturation }))
                    }
                  />
                  <SliderField
                    label="Warmth"
                    value={adjustments.warmth}
                    min={-100}
                    max={100}
                    display={`${adjustments.warmth > 0 ? "+" : ""}${adjustments.warmth}`}
                    onChange={(warmth) =>
                      setAdjustments((prev) => ({ ...prev, warmth }))
                    }
                  />
                  <SliderField
                    label="Soft blur"
                    value={adjustments.blur}
                    min={0}
                    max={8}
                    step={0.5}
                    display={`${adjustments.blur}px`}
                    onChange={(blur) =>
                      setAdjustments((prev) => ({ ...prev, blur }))
                    }
                  />
                  <SliderField
                    label="Vignette"
                    value={adjustments.vignette}
                    min={0}
                    max={100}
                    onChange={(vignette) =>
                      setAdjustments((prev) => ({ ...prev, vignette }))
                    }
                  />
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-semibold text-gold">
                    Transform
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <ToolButton
                      label="Rotate left"
                      onClick={() => rotate(-90)}
                      icon={<RotateCcw className="h-4 w-4" />}
                    />
                    <ToolButton
                      label="Rotate right"
                      onClick={() => rotate(90)}
                      icon={<RotateCw className="h-4 w-4" />}
                    />
                    <ToolButton
                      label="Flip horizontal"
                      onClick={() =>
                        setTransform((prev) => ({
                          ...prev,
                          flipH: !prev.flipH,
                        }))
                      }
                      icon={<FlipHorizontal2 className="h-4 w-4" />}
                    />
                    <ToolButton
                      label="Flip vertical"
                      onClick={() =>
                        setTransform((prev) => ({
                          ...prev,
                          flipV: !prev.flipV,
                        }))
                      }
                      icon={<FlipVertical2 className="h-4 w-4" />}
                    />
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-sage-dark/40 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={resetChanges}
            disabled={!originalSrc}
            className="rounded-lg border border-sage-dark/40 px-4 py-2.5 text-sm text-sage-light transition hover:border-gold hover:text-gold disabled:opacity-50"
          >
            Reset Changes
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-sage-dark/40 px-4 py-2.5 text-sm text-sage-light transition hover:border-gold hover:text-gold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!image || !crop || applyPending}
              onClick={() => void applyAndSave()}
              className="btn-gold inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-heading text-sm font-semibold disabled:opacity-60"
            >
              {applyPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Apply & Save to Article"
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs text-sage-light">
        <span>{label}</span>
        <span className="tabular-nums text-sage-dark">
          {display ?? `${value}%`}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-gold"
      />
    </label>
  );
}

function ToolButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-sage-dark/40 px-3 py-2 text-xs text-sage-light transition hover:border-gold hover:text-gold"
    >
      {icon}
      {label}
    </button>
  );
}
