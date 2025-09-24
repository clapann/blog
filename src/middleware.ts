import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/admin/")) {
        const token = request.cookies.get("admin-session")?.value;

        if (!token || !(await validateToken(token))) {
            const url = request.nextUrl.clone();
            url.pathname = "/admin";
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};