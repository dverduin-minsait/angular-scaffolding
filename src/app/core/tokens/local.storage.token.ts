import { InjectionToken, Provider } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export interface StorageService {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

export const LOCAL_STORAGE = new InjectionToken<StorageService>('LOCAL_STORAGE');

export const localStorageProvider: Provider = {
  provide: LOCAL_STORAGE,
  useFactory: (platformId: object) => {
    if (isPlatformBrowser(platformId)) {
      return {
        getItem: (key: string) => localStorage.getItem(key),
        setItem: (key: string, value: string) => localStorage.setItem(key, value),
        removeItem: (key: string) => localStorage.removeItem(key),
        clear: () => localStorage.clear()
      };
    } else {
      // Server-side implementation (no-op)
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
      };
    }
  },
  deps: [PLATFORM_ID]
};