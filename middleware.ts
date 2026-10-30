export { auth as middleware } from "@/auth";

// Pages are protected here. API routes protect themselves:
// /api/auth (sign-in), /api/items (API key), /api/cron (CRON_SECRET),
// /api/telegram (webhook secret), /api/upload (session check inside).
export const config = {
  matcher: [
    "/((?!api/|login|_next/|icons/|manifest.webmanifest|sw.js|logo-mark.svg|favicon.ico|robots.txt).*)",
  ],
};
