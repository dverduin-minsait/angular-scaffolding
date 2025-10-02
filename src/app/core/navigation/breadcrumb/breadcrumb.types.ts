import { ActivatedRouteSnapshot } from '@angular/router';

// Shape accepted in route data under 'breadcrumb'
export type BreadcrumbConfig =
  | string
  | ((route: ActivatedRouteSnapshot) => string)
  | {
      label: string | ((route: ActivatedRouteSnapshot) => string);
      icon?: string; // future enhancement (e.g. inline svg name)
      hide?: boolean;
    };

export interface BreadcrumbItem {
  url: string; // full path from root (leading slash)
  label: string;
  icon?: string;
  isLast: boolean;
  route: ActivatedRouteSnapshot; // reference (not for UI binding in templates directly)
}
