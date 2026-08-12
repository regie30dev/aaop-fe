/**
 * Client-side image downscaling. Resizes/compresses a picked image in the
 * browser (via canvas) before upload, so large photos stay well under the
 * server + Cloudinary limits and use less bandwidth.
 *
 * Safe by design: on any problem (non-image, decode failure, no canvas, or a
 * result that isn't actually smaller) it returns the ORIGINAL file untouched.
 */
export interface DownscaleOptions {
  /** Longest edge of the output, in pixels. */
  maxDimension?: number;
  /** JPEG quality, 0..1. */
  quality?: number;
  /** Files at or below this size (bytes) are uploaded as-is — not worth re-encoding. */
  skipUnderBytes?: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}

export async function downscaleImage(
  file: File,
  { maxDimension = 1600, quality = 0.82, skipUnderBytes = 1024 * 1024 }: DownscaleOptions = {},
): Promise<File> {
  // Only raster images in a real browser; small files aren't worth re-encoding.
  if (typeof document === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= skipUnderBytes) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const { naturalWidth: w, naturalHeight: h } = img;
    if (!w || !h) return file;

    const scale = Math.min(1, maxDimension / Math.max(w, h));
    const targetW = Math.max(1, Math.round(w * scale));
    const targetH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
    );
    // Keep the original if re-encoding didn't actually shrink it.
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^./\\]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file; // any failure → upload the original, unchanged
  } finally {
    URL.revokeObjectURL(url);
  }
}
