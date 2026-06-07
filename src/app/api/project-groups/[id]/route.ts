import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import "../../../../../models/project";
import ProjectGroup from "../../../../../models/projectGroup";
import { ADMIN_SESSION_COOKIE, isAdminCookieValid } from "../../../lib/adminAuth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

    const updatedGroup = await ProjectGroup.findByIdAndUpdate(
      params.id,
      { name, description, projects },
      { new: true, runValidators: true }
    ).populate("projects");

    if (!updatedGroup) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json(updatedGroup);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminCookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!isAdminCookieValid(adminCookie)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const deletedGroup = await ProjectGroup.findByIdAndDelete(params.id);

    if (!deletedGroup) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}