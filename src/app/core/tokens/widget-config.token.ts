import { InjectionToken } from '@angular/core';

/** Per-instance widget configuration injected via a child Injector by the dashboard. */
export interface WidgetConfig {
  widgetId: string;
  title: string;
  data: Record<string, unknown>;
}

export const WIDGET_CONFIG = new InjectionToken<WidgetConfig>('WIDGET_CONFIG');
