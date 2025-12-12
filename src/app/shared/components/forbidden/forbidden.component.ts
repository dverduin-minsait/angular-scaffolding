import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="forbidden" aria-labelledby="forbidden-title">
      <h1 id="forbidden-title">Access Denied</h1>
      <p>You do not have permission to view this page.</p>
      <a routerLink="/dashboard" class="back-link">Return to dashboard</a>
    </section>
  `,
  styles: [`
    .forbidden { padding: 4rem 1.5rem; max-width: 640px; margin: 0 auto; text-align:center; }
    .back-link { color: var(--color-primary, #0d6efd); text-decoration:none; font-weight:600; }
    .back-link:focus, .back-link:hover { text-decoration:underline; }
  `]
})
export class ForbiddenComponent {}
