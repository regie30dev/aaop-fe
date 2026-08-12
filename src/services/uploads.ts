import { BASE_URL } from "../api/client";

/**
 * Upload an image file to the backend (POST /uploads), which stores it in
 * Cloudinary and returns the hosted image URL. That URL is what we persist as
 * `imageUrl` on an employee/property.
 *
 * Note: we intentionally do NOT set a Content-Type header — the browser sets
 * the correct multipart/form-data boundary for the FormData body.
 */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/uploads`, { method: "POST", body: form });
  } catch {
    throw new Error("Cannot reach the server to upload the image.");
  }

  const body = (await res.json().catch(() => null)) as
    | { message?: string; data?: { imageUrl?: string } }
    | null;

  if (!res.ok) {
    throw new Error(body?.message ?? `Image upload failed (${res.status})`);
  }
  return body?.data?.imageUrl ?? "";
}
