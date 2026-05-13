import { Component, inject, computed } from '@angular/core';
import { WIDGET_CONFIG } from '../../../../../core/tokens/widget-config.token';
import { UserFocusService, FocusState } from '../../../services/user-focus.service';

@Component({
  selector: 'app-focus-widget',
  standalone: true,
  imports: [],
  template: `
    <div
      class="focus-widget"
      [attr.data-state]="state()"
      [style.--focus-hue]="hue()"
      role="status"
      [attr.aria-label]="ariaLabel()">

      <div class="face-wrap">
        <svg
          class="face"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true">

          <!-- Head -->
          <circle class="head" cx="50" cy="50" r="44" />

          <!-- Eyes -->
          <ellipse class="eye" cx="34" cy="40" rx="5" ry="5.5" />
          <ellipse class="eye" cx="66" cy="40" rx="5" ry="5.5" />

          <!-- Pupils — droop downward when idle/away -->
          <ellipse class="pupil" cx="34" cy="41" rx="2.5" ry="2.5" />
          <ellipse class="pupil" cx="66" cy="41" rx="2.5" ry="2.5" />

          <!-- Mouth shapes (cross-fade via opacity) -->
          <!-- Smile -->
          <path class="mouth mouth-smile"
                d="M 30 58 Q 50 76 70 58"
                fill="none" stroke-width="4" stroke-linecap="round" />
          <!-- Neutral -->
          <path class="mouth mouth-neutral"
                d="M 30 62 Q 50 62 70 62"
                fill="none" stroke-width="4" stroke-linecap="round" />
          <!-- Sad -->
          <path class="mouth mouth-sad"
                d="M 30 68 Q 50 54 70 68"
                fill="none" stroke-width="4" stroke-linecap="round" />
        </svg>
      </div>

      <div class="info">
        <span class="state-label">{{ stateLabel() }}</span>
        <span class="idle-time" aria-live="polite">
          {{ idleSeconds() }}s idle
        </span>
        @if (secondsUntilChange() > 0) {
          <div class="countdown-bar-wrap" [attr.aria-label]="'Changes in ' + secondsUntilChange() + 's'">
            <div class="countdown-bar" [style.width.%]="countdownPercent()"></div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './focus-widget.component.scss'
})
export class FocusWidgetComponent {
  private readonly config = inject(WIDGET_CONFIG);
  private readonly focusService = inject(UserFocusService);

  private readonly idleThreshold = Number(this.config.data['idleThreshold'] ?? 30);
  private readonly awayThreshold = Number(this.config.data['awayThreshold'] ?? 60);

  protected readonly state = this.focusService.focusState;
  protected readonly idleSeconds = this.focusService.idleSeconds;
  protected readonly secondsUntilChange = this.focusService.secondsUntilChange;

  protected readonly hue = computed<string>(() => {
    switch (this.state()) {
      case 'focused': return '142'; // green
      case 'idle':    return '45';  // yellow
      case 'away':    return '0';   // red
    }
  });

  protected readonly stateLabel = computed<string>(() => {
    switch (this.state()) {
      case 'focused': return 'Focused';
      case 'idle':    return 'Idle';
      case 'away':    return 'Away';
    }
  });

  protected readonly ariaLabel = computed<string>(() =>
    `User focus: ${this.stateLabel()}, ${this.idleSeconds()} seconds idle`
  );

  /** Percentage of the current state window consumed (for countdown bar). */
  protected readonly countdownPercent = computed<number>(() => {
    const s = this.idleSeconds();
    if (s < this.idleThreshold) {
      return 100 - Math.round((s / this.idleThreshold) * 100);
    }
    if (s < this.awayThreshold) {
      const elapsed = s - this.idleThreshold;
      const window = this.awayThreshold - this.idleThreshold;
      return 100 - Math.round((elapsed / window) * 100);
    }
    return 0;
  });
}
