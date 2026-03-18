import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirect bare domain (star4ce.com) to www (https://www.star4ce.com)
 * so everyone lands on the canonical HTTPS www URL.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const url = request.nextUrl;

  // Redirect star4ce.com (no www) to https://www.star4ce.com
  if (host === "star4ce.com") {
    const redirectUrl = new URL(url.pathname + url.search, "https://www.star4ce.com");
    return NextResponse.redirect(redirectUrl, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
