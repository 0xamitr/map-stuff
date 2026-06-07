// app/api/upload-geojson/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../lib/dbConnect";
import Project from "../../../../models/project";
import { ADMIN_SESSION_COOKIE, isAdminCookieValid } from "../../lib/adminAuth";
import { slugifyProjectName } from "../../lib/slug";

export async function POST(req: NextRequest) {
  try {
    const adminCookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!isAdminCookieValid(adminCookie)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { name, geojson, category, status } = body;
    const projectName = typeof name === "string" && name.trim() ? name.trim() : "untitled-project";
    const slugBase = slugifyProjectName(projectName) || "untitled-project";

    let slug = slugBase;
    let suffix = 2;

    while (await Project.exists({ slug })) {
      slug = `${slugBase}-${suffix}`;
      suffix += 1;
    }

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
      name: projectName,
      slug,
      geojson,
      category,
      status,
    });

    return NextResponse.json({
      success: true,
      id: project._id,
      slug: project.slug,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}