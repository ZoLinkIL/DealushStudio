"use client";
import type { FileRef, Item } from "./db";

export function fullCaption(i: Pick<Item, "caption" | "hashtags" | "affiliate_link">) {
  return [i.caption.trim(), i.hashtags.trim()].filter(Boolean).join("\n\n");
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

function forceDownloadUrl(f: FileRef) {
  if (f.downloadUrl) return f.downloadUrl;
  return f.url + (f.url.includes("?") ? "&" : "?") + "download=1";
}

/**
 * On a phone: opens the share sheet with the real files ("Save Image" → gallery,
 * full quality). On desktop: downloads them.
 */
export async function downloadFiles(files: FileRef[]) {
  if (!files.length) return false;
  try {
    const blobs = await Promise.all(
      files.map(async (f) => {
        const r = await fetch(f.url, { mode: "cors" });
        if (!r.ok) throw new Error("fetch failed");
        const b = await r.blob();
        return new File([b], f.name || "dealush", { type: b.type || f.type });
      })
    );
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    const isTouch = matchMedia("(pointer: coarse)").matches;
    if (isTouch && nav.canShare?.({ files: blobs })) {
      await navigator.share({ files: blobs });
      return true;
    }
    for (const file of blobs) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file);
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 1500);
    }
    return true;
  } catch (e) {
    if ((e as Error).name === "AbortError") return false; // user closed the share sheet
    for (const f of files) window.open(forceDownloadUrl(f), "_blank");
    return true;
  }
}

export function isImage(f: FileRef) {
  return f.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif)$/i.test(f.name);
}
export function isVideo(f: FileRef) {
  return f.type.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(f.name);
}
