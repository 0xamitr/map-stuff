import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../lib/dbConnect";
import ProjectGroup from "../../../../models/projectGroup";
import { ADMIN_SESSION_COOKIE, isAdminCookieValid } from "../../lib/adminAuth";

export async function GET(req: NextRequest) {
  try {
    const adminCookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!isAdminCookieValid(adminCookie)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const groups = await ProjectGroup.find({})
      .populate("projects")
      .sort({ createdAt: -1 });

    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load groups" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminCookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!isAdminCookieValid(adminCookie)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const name = body?.name?.trim();
    const description = body?.description?.trim() || "";
    const projects = Array.isArray(body?.projectIds) ? body.projectIds : [];

    if (!name) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const group = await ProjectGroup.create({
      name,
      description,
      projects,
    });

    const populatedGroup = await ProjectGroup.findById(group._id).populate("projects");

    return NextResponse.json({ success: true, group: populatedGroup });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}