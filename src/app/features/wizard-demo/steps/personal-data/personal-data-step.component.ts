import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { MULTI_STEP_FORM_STORE } from '../../../../shared/multi-step-form/tokens/multi-step-form.tokens';
import { WizardDemoData } from '../../store/wizard-demo.store';

@Component({
  selector: 'app-personal-data-step',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="personal-data-step">
      <h2 class="personal-data-step__title">{{ 'wizard.demo.steps.personalData' | translate }}</h2>
      <p class="personal-data-step__subtitle">{{ 'wizard.demo.personalData.subtitle' | translate }}</p>

      <form [formGroup]="form" class="personal-data-step__form" novalidate (ngSubmit)="$event.preventDefault()">
        <div class="personal-data-step__row">
          <div class="personal-data-step__field" [class.error]="isInvalid('firstName')">
            <label for="firstName" class="personal-data-step__label">
              {{ 'wizard.demo.personalData.firstName' | translate }} *
            </label>
            <input
              id="firstName"
              type="text"
              class="personal-data-step__control"
              formControlName="firstName"
              autocomplete="given-name"
              aria-required="true"
              [attr.aria-invalid]="isInvalid('firstName') || null"
              aria-describedby="firstName-error" />
            @if (isInvalid('firstName')) {
              <span id="firstName-error" class="personal-data-step__error" role="alert">
                {{ 'wizard.demo.personalData.firstNameError' | translate }}
              </span>
            }
          </div>

          <div class="personal-data-step__field" [class.error]="isInvalid('lastName')">
            <label for="lastName" class="personal-data-step__label">
              {{ 'wizard.demo.personalData.lastName' | translate }} *
            </label>
            <input
              id="lastName"
              type="text"
              class="personal-data-step__control"
              formControlName="lastName"
              autocomplete="family-name"
              aria-required="true"
              [attr.aria-invalid]="isInvalid('lastName') || null"
              aria-describedby="lastName-error" />
            @if (isInvalid('lastName')) {
              <span id="lastName-error" class="personal-data-step__error" role="alert">
                {{ 'wizard.demo.personalData.lastNameError' | translate }}
              </span>
            }
          </div>
        </div>

        <div class="personal-data-step__field" [class.error]="isInvalid('email')">
          <label for="email" class="personal-data-step__label">
            {{ 'wizard.demo.personalData.email' | translate }} *
          </label>
          <input
            id="email"
            type="email"
            class="personal-data-step__control"
            formControlName="email"
            autocomplete="email"
            aria-required="true"
            [attr.aria-invalid]="isInvalid('email') || null"
            aria-describedby="email-error" />
          @if (isInvalid('email')) {
            <span id="email-error" class="personal-data-step__error" role="alert">
              {{ 'wizard.demo.personalData.emailError' | translate }}
            </span>
          }
        </div>

        <div class="personal-data-step__field" [class.error]="isInvalid('birthYear')">
          <label for="birthYear" class="personal-data-step__label">
            {{ 'wizard.demo.personalData.birthYear' | translate }} *
          </label>
          <input
            id="birthYear"
            type="number"
            class="personal-data-step__control"
            formControlName="birthYear"
            autocomplete="bday-year"
            [attr.min]="minYear"
            [attr.max]="maxYear"
            aria-required="true"
            [attr.aria-invalid]="isInvalid('birthYear') || null"
            aria-describedby="birthYear-error" />
          @if (isInvalid('birthYear')) {
            <span id="birthYear-error" class="personal-data-step__error" role="alert">
              {{ 'wizard.demo.personalData.birthYearError' | translate }}
            </span>
          }
        </div>
      </form>
    </div>
  `,
  styleUrl: './personal-data-step.component.scss',
})
export class PersonalDataStepComponent implements OnInit {
  protected readonly store = inject(MULTI_STEP_FORM_STORE);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly minYear = 1900;
  protected readonly maxYear = new Date().getFullYear() - 5;

  /* eslint-disable @typescript-eslint/unbound-method */
  protected readonly form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    birthYear: [
      null,
      [Validators.required, Validators.min(this.minYear), Validators.max(this.maxYear)],
    ],
  });
  /* eslint-enable @typescript-eslint/unbound-method */

  ngOnInit(): void {
    // Pre-fill from store
    const existing = this.store.formData() as Partial<WizardDemoData>;
    if (existing.firstName) {
      this.form.patchValue(
        {
          firstName: existing.firstName,
          lastName: existing.lastName,
          email: existing.email,
          birthYear: existing.birthYear,
        },
        { emitEvent: false }
      );
    }

    this.store.setCurrentStepValid(this.form.valid);

    this.form.valueChanges.pipe(
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(value => {
      this.store.setDirty(true);
      this.store.setCurrentStepValid(this.form.valid);
      if (this.form.valid) {
        this.store.updateStepData(value as Record<string, unknown>);
      }
    });
  }

  protected isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }
}
