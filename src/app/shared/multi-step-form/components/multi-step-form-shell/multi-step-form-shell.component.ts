import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { MULTI_STEP_FORM_CONFIG, MULTI_STEP_FORM_STORE } from '../../tokens/multi-step-form.tokens';
import { MultiStepBreadcrumbsComponent } from '../breadcrumbs/multi-step-breadcrumbs.component';
import { ButtonDirective } from '../../../directives/button.directive';

@Component({
  selector: 'app-multi-step-form-shell',
  standalone: true,
  imports: [RouterOutlet, TranslatePipe, MultiStepBreadcrumbsComponent, ButtonDirective],
  template: `
    <div class="msf-shell">
      <header class="msf-shell__header">
        <app-multi-step-breadcrumbs
          [steps]="store.steps()"
          [currentPath]="currentPath()" />

        <div class="msf-shell__progress" role="progressbar"
          [attr.aria-valuenow]="store.progressPercent()"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-label]="'wizard.progress.label' | translate">
          <div class="msf-shell__progress-bar"
            [style.width.%]="store.progressPercent()"></div>
        </div>
      </header>

      @if (store.submitResult()?.success) {
        <section class="msf-shell__success" role="status" aria-live="polite">
          <div class="msf-shell__success-icon" aria-hidden="true">✓</div>
          <h2>{{ 'wizard.success.title' | translate }}</h2>
          <p>{{ 'wizard.success.message' | translate }}</p>
          <button type="button" appButton (click)="reset()">
            {{ 'wizard.actions.startOver' | translate }}
          </button>
        </section>
      } @else {
        <main class="msf-shell__content" id="wizard-step-content">
          <router-outlet />
        </main>

        <nav class="msf-shell__nav" aria-label="{{ 'wizard.navigation.label' | translate }}">
          @if (store.canGoPrev()) {
            <button
              type="button"
              appButton
              variant="secondary"
              (click)="goBack()"
              [attr.aria-label]="'wizard.actions.back' | translate">
              {{ 'wizard.actions.back' | translate }}
            </button>
          } @else {
            <span></span>
          }

          @if (!store.isLastStep()) {
            <button
              type="button"
              appButton
              [disabled]="!store.canGoNext()"
              [attr.aria-disabled]="!store.canGoNext()"
              (click)="goNext()"
              [attr.aria-label]="'wizard.actions.next' | translate">
              {{ 'wizard.actions.next' | translate }}
            </button>
          }
        </nav>
      }
    </div>
  `,
  styleUrl: './multi-step-form-shell.component.scss',
})
export class MultiStepFormShellComponent implements OnInit {
  protected readonly store = inject(MULTI_STEP_FORM_STORE);
  private readonly config = inject(MULTI_STEP_FORM_CONFIG);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentPath = computed(() => {
    const steps = this.store.steps();
    const idx = this.store.currentStepIndex();
    return steps[idx]?.path ?? '';
  });

  ngOnInit(): void {
    this.store.initialize(this.config);

    // Sync current step index when URL changes (handles browser back/forward).
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      const urlSegments = this.router.url.split('?')[0].split('/');
      const lastSegment = urlSegments[urlSegments.length - 1];
      if (lastSegment) {
        this.store.setCurrentStepFromPath(lastSegment);
      }
    });
  }

  protected goNext(): void {
    if (!this.store.canGoNext()) return;
    this.store.completeCurrentStep();
    const steps = this.store.steps();
    const nextIdx = this.store.currentStepIndex() + 1;
    const nextStep = steps[nextIdx];
    if (nextStep) {
      void this.router.navigate([nextStep.path], { relativeTo: this.route });
    }
  }

  protected goBack(): void {
    const steps = this.store.steps();
    const prevIdx = this.store.currentStepIndex() - 1;
    const prevStep = steps[prevIdx];
    if (prevStep) {
      void this.router.navigate([prevStep.path], { relativeTo: this.route });
    }
  }

  protected reset(): void {
    this.store.reset();
    const firstStep = this.config[0];
    if (firstStep) {
      void this.router.navigate([firstStep.path], { relativeTo: this.route });
    }
  }
}
