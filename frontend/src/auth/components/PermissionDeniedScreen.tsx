import { ShieldAlert } from "lucide-react";

interface PermissionDeniedScreenProps {
  requiredPermissions?: string[];
}

export function PermissionDeniedScreen({ requiredPermissions = [] }: PermissionDeniedScreenProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <ShieldAlert className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have permission to access this page.
        </p>
        {requiredPermissions.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground">Required permissions:</p>
            <ul className="mt-2 space-y-1">
              {requiredPermissions.map((permission) => (
                <li key={permission} className="text-xs text-muted-foreground">
                  • {permission}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
