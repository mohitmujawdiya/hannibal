import { NextResponse, type NextRequest } from "next/server";

const DEMO_COOKIE = "hannibal-demo";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set demo cookie so tRPC/chat routes can identify demo visitors
  if (!request.cookies.get(DEMO_COOKIE)) {
    response.cookies.set(DEMO_COOKIE, "true", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/demo", "/demo/:path*"],
};
