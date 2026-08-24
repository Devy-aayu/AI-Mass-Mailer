import { NextRequest, NextResponse } from "next/server";

/**
 * Authentication is handled by the FastAPI backend through its HTTP-only
 * session cookie and by AuthGate on the client. Do not try to read the backend
 * cookie here: when frontend and API are deployed on different Vercel domains,
 * the backend cookie is intentionally not visible to Next.js middleware.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
