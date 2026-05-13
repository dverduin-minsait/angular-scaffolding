import { InjectionToken, Type } from '@angular/core';

/**
 * Maps widget type strings to standalone component classes.
 * Provided at dashboard route level — add new widget types here
 * without touching any template or switch statement.
 */
export const WIDGET_REGISTRY = new InjectionToken<Record<string, Type<unknown>>>('WIDGET_REGISTRY');
