// app/api/upload-geojson/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../lib/dbConnect";
import Project from "../../../../models/project";
import { ADMIN_SESSION_COOKIE, isAdminCookieValid } from "../../lib/adminAuth";

export async function POST(req: NextRequest) {
  try {
    const adminCookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!isAdminCookieValid(adminCookie)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { name, geojson, category, status } = body;

    if (!geojson) {
      return NextResponse.json(
        { error: "GeoJSON required" },
        { status: 400 }
      );
    }

    const allowed = [
      "high speed rail",
      "expressway",
      "metros",
    ];

    const allowedStatus = ["u/c", "proposed", "completed"];

    if (!category || !allowed.includes(category)) {
      return NextResponse.json(
        { error: "Invalid or missing category" },
        { status: 400 }
      );
    }

    if (!status || !allowedStatus.includes(status)) {
      return NextResponse.json(
        { error: "Invalid or missing status" },
        { status: 400 }
      );
    }

    const project = await Project.create({
      name,
      geojson,
      category,
      status,
    });

    return NextResponse.json({
      success: true,
      id: project._id,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}