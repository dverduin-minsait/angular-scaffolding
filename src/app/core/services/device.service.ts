import { Injectable, PLATFORM_ID, inject, signal, computed, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  supportsGrids: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly MOBILE_BREAKPOINT = 768;
  private readonly TABLET_BREAKPOINT = 1024;
  private platformId = inject(PLATFORM_ID);
  
  // Signal-based device info
  private deviceInfoSignal = signal<DeviceInfo>(this.getDeviceInfo());
  
  // Public computed signals
  public deviceInfo = this.deviceInfoSignal.asReadonly();
  public isMobile = computed(() => this.deviceInfo().isMobile);
  public isTablet = computed(() => this.deviceInfo().isTablet);
  public isDesktop = computed(() => this.deviceInfo().isDesktop);
  public supportsGrids = computed(() => this.deviceInfo().supportsGrids);
  public screenWidth = computed(() => this.deviceInfo().screenWidth);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Set up resize listener
      window.addEventListener('resize', () => {
        this.updateDeviceInfo();
      });
      
      // Initial update
      this.updateDeviceInfo();
    }
  }

  private getDeviceInfo(): DeviceInfo {
    if (!isPlatformBrowser(this.platformId)) {
      // SSR default - assume desktop to avoid hydration issues
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1024,
        supportsGrids: true
      };
    }

    const screenWidth = window.innerWidth;
    const isMobile = screenWidth < this.MOBILE_BREAKPOINT;
    const isTablet = screenWidth >= this.MOBILE_BREAKPOINT && screenWidth < this.TABLET_BREAKPOINT;
    const isDesktop = screenWidth >= this.TABLET_BREAKPOINT;
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      screenWidth,
      supportsGrids: !isMobile // Only desktop and tablet support grids
    };
  }

  private updateDeviceInfo(): void {
    const newDeviceInfo = this.getDeviceInfo();
    this.deviceInfoSignal.set(newDeviceInfo);
  }

  // Backward compatibility getter
  get currentDevice(): DeviceInfo {
    return this.deviceInfo();
  }
}