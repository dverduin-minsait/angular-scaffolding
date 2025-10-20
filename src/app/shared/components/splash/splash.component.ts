import { Component, computed, inject } from '@angular/core';
import { AuthStore } from '../../../core/auth/stores/auth.store';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [],
  template: `
  @if(show()) {
    <div class="splash" role="status" aria-live="polite">
      <div class="spinner" aria-hidden="true"></div>
      <p class="message">Initializing session...</p>
    </div>
  }
  `,
  styles: [`
    .splash { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100dvh; gap:1rem; font: 600 1rem/1.2 system-ui; color: var(--color-fg, #222); }
    .spinner { width:48px; height:48px; border-radius:50%; border:4px solid #ccc; border-top-color:#0d6efd; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SplashComponent {
  private readonly auth = inject(AuthStore);
  readonly show = computed(() => this.auth.status() === 'unknown');
}
