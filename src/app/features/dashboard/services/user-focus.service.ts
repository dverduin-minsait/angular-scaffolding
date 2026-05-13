import { Injectable, inject, signal, computed, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { fromEvent, merge } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

export type FocusState = 'focused' | 'idle' | 'away';

@Injectable({ providedIn: 'root' })
export class UserFocusService {
  private readonly _idleSeconds = signal(0);

  readonly idleSeconds = this._idleSeconds.asReadonly();

  readonly focusState = computed<FocusState>(() => {
    const s = this._idleSeconds();
    if (s < 30) return 'focused';
    if (s < 60) return 'idle';
    return 'away';
  });

  /** Seconds until next state change (0 when already at worst state). */
  readonly secondsUntilChange = computed<number>(() => {
    const s = this._idleSeconds();
    if (s < 30) return 30 - s;
    if (s < 60) return 60 - s;
    return 0;
  });

  constructor() {
    const platformId = inject(PLATFORM_ID);
    const destroyRef = inject(DestroyRef);

    if (!isPlatformBrowser(platformId)) return;

    // Increment idle counter every second
    const intervalId = setInterval(() => {
      this._idleSeconds.update(s => s + 1);
    }, 1000);

    // Reset on any user activity (throttled to once per 500ms to avoid signal storms)
    const activity$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'mousedown'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'scroll', { passive: true }),
      fromEvent(document, 'touchstart', { passive: true })
    ).pipe(throttleTime(500));

    const sub = activity$.subscribe(() => {
      this._idleSeconds.set(0);
    });

    destroyRef.onDestroy(() => {
      clearInterval(intervalId);
      sub.unsubscribe();
    });
  }
}
