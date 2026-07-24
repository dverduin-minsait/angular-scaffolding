import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { StepMeta } from '../../models/step.model';

@Component({
  selector: 'app-multi-step-breadcrumbs',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <nav aria-label="{{ 'wizard.steps.nav' | translate }}" class="msf-breadcrumbs">
      <ol class="msf-breadcrumbs__list" role="list">
        @for (step of steps(); track step.path; let last = $last) {
          <li
            class="msf-breadcrumbs__item"
            [class.msf-breadcrumbs__item--completed]="step.isCompleted"
            [class.msf-breadcrumbs__item--current]="step.isCurrent"
            [class.msf-breadcrumbs__item--pending]="!step.isAccessible && !step.isCurrent">

            @if (step.isAccessible && !step.isCurrent) {
              <a
                [routerLink]="step.path"
                class="msf-breadcrumbs__link"
                [attr.aria-label]="step.titleKey | translate">
                <span class="msf-breadcrumbs__index" aria-hidden="true">{{ step.index + 1 }}</span>
                <span class="msf-breadcrumbs__label">{{ step.titleKey | translate }}</span>
              </a>
            } @else {
              <span
                class="msf-breadcrumbs__link"
                [attr.aria-current]="step.isCurrent ? 'step' : null"
                [attr.aria-disabled]="!step.isAccessible ? 'true' : null">
                <span class="msf-breadcrumbs__index" aria-hidden="true">{{ step.index + 1 }}</span>
                <span class="msf-breadcrumbs__label">{{ step.titleKey | translate }}</span>
              </span>
            }

            @if (!last) {
              <span class="msf-breadcrumbs__separator" aria-hidden="true">›</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styleUrl: './multi-step-breadcrumbs.component.scss',
})
export class MultiStepBreadcrumbsComponent {
  readonly steps = input.required<StepMeta[]>();
  readonly currentPath = input<string>('');
}
