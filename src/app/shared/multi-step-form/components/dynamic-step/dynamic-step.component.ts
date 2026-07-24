import {
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { distinctUntilChanged } from 'rxjs';
import { FieldConfig } from '../../models/step.model';
import { MULTI_STEP_FORM_STORE } from '../../tokens/multi-step-form.tokens';

/**
 * Renders a step dynamically from FieldConfig[] provided in route data.
 * Place this as the component for declarative (non-custom) steps.
 *
 * Route data example:
 * ```
 * data: { stepIndex: 1, fields: [ { name: 'hobby', type: 'select', ... } ] }
 * ```
 */
@Component({
  selector: 'app-dynamic-step',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="dynamic-step">
      @if (stepTitle) {
        <h2 class="dynamic-step__title">{{ stepTitle | translate }}</h2>
      }
      <form [formGroup]="form" class="dynamic-step__form" (ngSubmit)="$event.preventDefault()" novalidate>
        @for (field of fields; track field.name) {
          <div class="dynamic-step__field" [class.dynamic-step__field--error]="isFieldInvalid(field.name)">
            <label
              class="dynamic-step__label"
              [attr.for]="field.name"
              [class.dynamic-step__label--required]="field.required">
              {{ field.labelKey | translate }}
            </label>

            @switch (field.type) {
              @case ('select') {
                <select
                  class="dynamic-step__control"
                  [id]="field.name"
                  [formControlName]="field.name"
                  [attr.aria-required]="field.required || null"
                  [attr.aria-invalid]="isFieldInvalid(field.name) || null"
                  [attr.aria-describedby]="isFieldInvalid(field.name) ? field.name + '-error' : null">
                  <option value="">{{ field.placeholderKey ? (field.placeholderKey | translate) : '' }}</option>
                  @for (opt of field.options ?? []; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              }
              @case ('textarea') {
                <textarea
                  class="dynamic-step__control"
                  [id]="field.name"
                  [formControlName]="field.name"
                  rows="4"
                  [attr.aria-required]="field.required || null"
                  [attr.aria-invalid]="isFieldInvalid(field.name) || null"
                  [attr.aria-describedby]="isFieldInvalid(field.name) ? field.name + '-error' : null">
                </textarea>
              }
              @case ('checkbox') {
                <input
                  type="checkbox"
                  class="dynamic-step__checkbox"
                  [id]="field.name"
                  [formControlName]="field.name"
                  [attr.aria-required]="field.required || null" />
              }
              @case ('range') {
                <input
                  type="range"
                  class="dynamic-step__control"
                  [id]="field.name"
                  [formControlName]="field.name"
                  [attr.min]="field.min ?? 0"
                  [attr.max]="field.max ?? 100"
                  [attr.aria-required]="field.required || null"
                  [attr.aria-valuemin]="field.min ?? 0"
                  [attr.aria-valuemax]="field.max ?? 100" />
              }
              @default {
                <input
                  [type]="field.type"
                  class="dynamic-step__control"
                  [id]="field.name"
                  [formControlName]="field.name"
                  [attr.placeholder]="field.placeholderKey ? (field.placeholderKey | translate) : null"
                  [attr.min]="field.min ?? null"
                  [attr.max]="field.max ?? null"
                  [attr.aria-required]="field.required || null"
                  [attr.aria-invalid]="isFieldInvalid(field.name) || null"
                  [attr.aria-describedby]="isFieldInvalid(field.name) ? field.name + '-error' : null" />
              }
            }

            @if (isFieldInvalid(field.name)) {
              <span
                class="dynamic-step__error"
                [id]="field.name + '-error'"
                role="alert"
                aria-live="polite">
                @if (form.get(field.name)?.errors?.['required']) {
                  {{ 'wizard.validation.required' | translate }}
                } @else if (form.get(field.name)?.errors?.['min']) {
                  {{ 'wizard.validation.min' | translate: { min: field.min } }}
                } @else if (form.get(field.name)?.errors?.['max']) {
                  {{ 'wizard.validation.max' | translate: { max: field.max } }}
                }
              </span>
            }
          </div>
        }
      </form>
    </div>
  `,
  styleUrl: './dynamic-step.component.scss',
})
export class DynamicStepComponent implements OnInit {
  protected readonly store = inject(MULTI_STEP_FORM_STORE);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected fields: FieldConfig[] = [];
  protected stepTitle = '';
  protected form!: FormGroup;

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.fields = (data['fields'] as FieldConfig[]) ?? [];
    this.stepTitle = (data['stepTitle'] as string) ?? '';

    this.form = this.buildFormGroup();

    // Pre-populate from store data
    const existing = this.store.formData();
    if (existing && Object.keys(existing).length > 0) {
      this.form.patchValue(existing, { emitEvent: false });
    }

    // Initial validity
    this.store.setCurrentStepValid(this.form.valid);

    // React to form changes
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

  protected isFieldInvalid(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  private buildFormGroup(): FormGroup {
    const controls: Record<string, unknown[]> = {};
    for (const field of this.fields) {
      const validators = [];
      if (field.required) validators.push(Validators.required);
      if (field.min !== undefined) validators.push(Validators.min(field.min));
      if (field.max !== undefined) validators.push(Validators.max(field.max));
      controls[field.name] = [null, validators];
    }
    return this.fb.group(controls);
  }
}
