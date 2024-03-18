export const hasRole = (userRoles: string[], authorizedRoles: string[]): boolean =>
  userRoles.reduce<boolean>((matched, role) => {
    if (matched) return matched;
    if (!authorizedRoles.includes(role)) return false;

    return true;
  }, false);
