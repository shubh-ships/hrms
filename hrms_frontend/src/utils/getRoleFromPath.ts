import type { Role } from "@/components/config/navigation";

export function getRoleFromPath(pathname: string): Role | string | null {
  const segments = pathname.split("/");
  const role = segments[2];
  

  if (role === 'admin' || role === 'super_admin') {
    return role as Role;
  }
  

  return role ? 'dynamic' : null;
}