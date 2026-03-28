import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Scanner/bot spesso inviano path tipo /https%3A/www.example.com/...
 * (URL incollati come path). Rispondere 400 evita 500 inutili nei log.
 * I 500 su GET / reale vanno diagnosticati a parte (Passenger, build, env).
 */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const lower = path.toLowerCase();
  if (
    lower.includes("https%3a") ||
    lower.includes("http%3a") ||
    /^\/https?:\//i.test(path)
  ) {
    return new NextResponse(null, { status: 400 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
