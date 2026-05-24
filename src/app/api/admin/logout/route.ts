import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "../../../lib/adminAuth";

export async function POST(_req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}