/**
 * Image links pasted by hand or arriving in a CSV need a sanity check
 * before they're stored: a Google Images *search* URL
 * (google.com/search?tbm=isch&q=...) is a web page, not a picture, and
 * renders as a broken image if treated like one. This is the single
 * place that distinction lives.
 */

const SEARCH_PAGE_HOSTS = [
  "google.com/search",
  "google.co.il/search",
  "bing.com/images/search",
  "duckduckgo.com",
  "images.google",
  "yandex.com/images",
];

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif|bmp|svg)(\?|#|$)/i;

export type ImageUrlVerdict =
  | { ok: true; url: string }
  | { ok: false; url: string; reason: string };

export function checkImageUrl(raw: string): ImageUrlVerdict {
  const url = raw.trim();
  if (!url) return { ok: false, url, reason: "קישור ריק" };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, url, reason: "קישור לא תקין" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, url, reason: "הקישור חייב להתחיל ב-http או https" };
  }

  const haystack = `${parsed.host}${parsed.pathname}`.toLowerCase();
  if (SEARCH_PAGE_HOSTS.some((h) => haystack.includes(h))) {
    return {
      ok: false,
      url,
      reason: "זהו קישור לעמוד חיפוש תמונות, לא לתמונה עצמה. יש להעתיק את כתובת התמונה עצמה (קליק ימני על התמונה ← העתקת כתובת תמונה)",
    };
  }

  // A direct link usually ends in an image extension, but plenty of CDNs
  // serve images from extension-less paths, so this is a warning signal
  // rather than a hard rejection — we accept it and let the browser try.
  if (!IMAGE_EXTENSIONS.test(parsed.pathname)) {
    return { ok: true, url };
  }

  return { ok: true, url };
}

/** Splits a multi-image cell (comma, pipe or newline separated). */
export function splitImageUrls(raw: string): string[] {
  return raw
    .split(/[\n|,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
