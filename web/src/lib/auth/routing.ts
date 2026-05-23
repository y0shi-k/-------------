export const loginPath = "/login";
export const homePath = "/";

export function getAuthRedirectPath(pathname: string, isAuthenticated: boolean): string | null {
  if (!isAuthenticated && pathname !== loginPath) {
    return loginPath;
  }

  if (isAuthenticated && pathname === loginPath) {
    return homePath;
  }

  return null;
}
