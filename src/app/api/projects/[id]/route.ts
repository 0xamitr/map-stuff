import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Project from "../../../../../models/project";
import { ADMIN_SESSION_COOKIE, isAdminCookieValid } from "../../../lib/adminAuth";

const allowedStatus = ["u/c", "proposed", "completed"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminCookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!isAdminCookieValid(adminCookie)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body || {};

    if (!status || !allowedStatus.includes(status)) {
      return NextResponse.json(
        { error: "Invalid or missing status" },
        { status: 400 }
      );
    }

    await dbConnect();

    const updatedProject = await Project.findByIdAndUpdate(
      params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}