import { NextResponse, type NextRequest } from "next/server";
import { isDemoApiEnabled, isDemoApiPath } from "./backend/demoApiGate";

export function proxy(request: NextRequest) {
  if (isDemoApiPath(request.nextUrl.pathname) && !isDemoApiEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "demo_api_disabled",
          message: "Demo API disabled in production",
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/workspaces/:path*"],
};
