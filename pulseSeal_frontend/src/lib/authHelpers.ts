import { jwtDecode as jwt_decode } from "jwt-decode";
 
export function getOrgIdFromToken() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const decoded: any = jwt_decode(token);
    return decoded.user.organizationId || decoded.user.organizationId || null;
  } catch {
    return null;
  }
}