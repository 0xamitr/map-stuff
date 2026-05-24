import { cookies } from "next/headers";
import AdminPanel from "./AdminPanel";
import { ADMIN_SESSION_COOKIE, getAdminSessionToken } from "../lib/adminAuth";

export default function AdminPage() {
  const adminCookie = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const isAuthed = adminCookie === getAdminSessionToken();

  return <AdminPanel initialIsAuthed={isAuthed} />;
}