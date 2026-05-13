import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { vi, afterEach } from 'vitest';
import { UserFocusService } from './user-focus.service';

describe('UserFocusService', () => {
  let service: UserFocusService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        UserFocusService
      ]
    });
    service = TestBed.inject(UserFocusService);
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should start with focusState = "focused"', () => {
    expect(service.focusState()).toBe('focused');
  });

  it('should start with idleSeconds = 0', () => {
    expect(service.idleSeconds()).toBe(0);
  });

  it('should increment idleSeconds each second', () => {
    vi.advanceTimersByTime(5000);
    TestBed.flushEffects();
    expect(service.idleSeconds()).toBe(5);
  });

  it('should transition to "idle" after 30 seconds', () => {
    vi.advanceTimersByTime(30000);
    TestBed.flushEffects();
    expect(service.focusState()).toBe('idle');
  });

  it('should transition to "away" after 60 seconds', () => {
    vi.advanceTimersByTime(60000);
    TestBed.flushEffects();
    expect(service.focusState()).toBe('away');
  });

  it('should return secondsUntilChange = 30 when focused at 0s', () => {
    expect(service.secondsUntilChange()).toBe(30);
  });

  it('should return secondsUntilChange = 0 when away', () => {
    vi.advanceTimersByTime(60000);
    TestBed.flushEffects();
    expect(service.secondsUntilChange()).toBe(0);
  });

  it('should reset idleSeconds on mousemove event', () => {
    vi.advanceTimersByTime(10000);
    TestBed.flushEffects();
    expect(service.idleSeconds()).toBe(10);

    document.dispatchEvent(new MouseEvent('mousemove'));
    // Wait for throttle to pass
    vi.advanceTimersByTime(600);
    TestBed.flushEffects();
    expect(service.idleSeconds()).toBe(0);
  });

  it('should reset idleSeconds on keydown event', () => {
    vi.advanceTimersByTime(15000);
    TestBed.flushEffects();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    vi.advanceTimersByTime(600);
    TestBed.flushEffects();
    expect(service.idleSeconds()).toBe(0);
  });
});
