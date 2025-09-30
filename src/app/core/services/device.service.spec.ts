import { TestBed } from '@angular/core/testing';
import { DeviceService } from './device.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

describe('DeviceService', () => {
  function setWidth(width: number) {
    // @ts-ignore
    window.innerWidth = width;
    window.dispatchEvent(new Event('resize'));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DeviceService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
  });

  it('should default to desktop for large widths', () => {
    setWidth(1400);
    const svc = TestBed.inject(DeviceService);
    expect(svc.isDesktop()).toBe(true);
    expect(svc.isMobile()).toBe(false);
    expect(svc.isTablet()).toBe(false);
    expect(svc.supportsGrids()).toBe(true);
  });

  it('should detect tablet breakpoint', () => {
    setWidth(900);
    const svc = TestBed.inject(DeviceService);
    expect(svc.isTablet()).toBe(true);
    expect(svc.isDesktop()).toBe(false);
  });

  it('should detect mobile breakpoint and disable grids', () => {
    setWidth(500);
    const svc = TestBed.inject(DeviceService);
    expect(svc.isMobile()).toBe(true);
    expect(svc.supportsGrids()).toBe(false);
  });

  it('should expose currentDevice getter consistent with deviceInfo()', () => {
    const svc = TestBed.inject(DeviceService);
    const info = svc.currentDevice;
    expect(info.screenWidth).toBeDefined();
    expect(info.isDesktop || info.isMobile || info.isTablet).toBe(true);
    expect(info.supportsGrids).toBe(info.isDesktop || info.isTablet);
  });

  it('should update signals after a live resize event (desktop -> mobile)', () => {
    setWidth(1200);
    const svc = TestBed.inject(DeviceService);
    expect(svc.isDesktop()).toBe(true);
    // Transition to mobile
    setWidth(500);
    // Signals should reflect new state without re-instantiation
    expect(svc.isMobile()).toBe(true);
    expect(svc.supportsGrids()).toBe(false);
  });
});

describe('DeviceService (SSR)', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        DeviceService,
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });
  });

  it('should return desktop defaults on server to avoid hydration issues', () => {
    const svc = TestBed.inject(DeviceService);
    expect(svc.isDesktop()).toBe(true);
    expect(svc.isMobile()).toBe(false);
    expect(svc.isTablet()).toBe(false);
    expect(svc.supportsGrids()).toBe(true);
    const info = svc.currentDevice;
    expect(info.screenWidth).toBe(1024);
  });
});
