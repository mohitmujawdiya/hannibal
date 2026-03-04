import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const DEMO_COOKIE = "hannibal-demo";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/waitlist(.*)",
  "/demo(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Block direct sign-up unless coming from a Clerk invitation link
  if (pathname.startsWith("/sign-up") && !request.nextUrl.searchParams.has("__clerk_ticket")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Set demo cookie for /demo routes so tRPC/chat can identify demo visitors
  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    const response = NextResponse.next();
    if (!request.cookies.get(DEMO_COOKIE)) {
      response.cookies.set(DEMO_COOKIE, "true", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }
    return response;
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
