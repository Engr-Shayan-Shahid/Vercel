export type AccountType = "importer" | "exporter";

export function getDefaultHomePath(accountType: AccountType | null | undefined): string {
  return accountType === "exporter" ? "/exporter" : "/";
}

const IMPORTER_PATHS = ["/", "/import-logs", "/emissions-reports", "/settings", "/shipments"];

export function isImporterPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/import-logs") ||
    pathname.startsWith("/emissions-reports") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/shipments")
  );
}

export function isExporterPath(pathname: string): boolean {
  return pathname === "/exporter" || pathname.startsWith("/exporter/");
}

export function isProtectedPath(pathname: string): boolean {
  return isImporterPath(pathname) || isExporterPath(pathname);
}

export function inferRoleFromPath(pathname: string): AccountType {
  return isExporterPath(pathname) ? "exporter" : "importer";
}

export { IMPORTER_PATHS };
