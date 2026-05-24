const ADMIN_SESSION_COOKIE = "admin-session";

export const getAdminSessionToken = () =>
  process.env.ADMIN_SESSION_TOKEN || process.env.ADMIN_PASSWORD || "admin-session";

export const isAdminCookieValid = (cookieValue) => cookieValue === getAdminSessionToken();

export { ADMIN_SESSION_COOKIE };