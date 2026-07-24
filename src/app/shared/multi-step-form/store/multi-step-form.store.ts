import { computed, signal } from '@angular/core';
import { BaseSignalStore } from '../../../core/store/base-signal.store';
import { StepConfig, StepMeta } from '../models/step.model';

export interface SubmitResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  timestamp: number;
}

/**
 * Generic signal-based store for multi-step forms.
 * Extends BaseSignalStore for shared loading/error state.
 *
 * @template TData - Shape of the aggregated form data.
 */
export class MultiStepFormStore<
  TData extends Record<string, unknown> = Record<string, unknown>
> extends BaseSignalStore {
  private readonly _formData = signal<Partial<TData>>({});
  private readonly _steps = signal<StepMeta[]>([]);
  private readonly _currentStepIndex = signal<number>(0);
  private readonly _isDirty = signal<boolean>(false);
  private readonly _isCurrentStepValid = signal<boolean>(false);
  private readonly _submitResult = signal<SubmitResult | null>(null);

  readonly formData = this._formData.asReadonly();
  readonly steps = this._steps.asReadonly();
  readonly currentStepIndex = this._currentStepIndex.asReadonly();
  readonly isDirty = this._isDirty.asReadonly();
  readonly isCurrentStepValid = this._isCurrentStepValid.asReadonly();
  readonly submitResult = this._submitResult.asReadonly();

  readonly currentStep = computed(() => this._steps()[this._currentStepIndex()] ?? null);
  readonly isLastStep = computed(() => {
    const steps = this._steps();
    return steps.length > 0 && this._currentStepIndex() === steps.length - 1;
  });
  readonly canGoNext = computed(() => this._isCurrentStepValid());
  readonly canGoPrev = computed(() => this._currentStepIndex() > 0);
  readonly isInitialized = computed(() => this._steps().length > 0);
  readonly progressPercent = computed(() => {
    const steps = this._steps();
    if (steps.length === 0) return 0;
    const completed = steps.filter(s => s.isCompleted).length;
    return Math.round((completed / steps.length) * 100);
  });

  /** Initialize steps from config. Call from shell component on init. */
  initialize(configs: StepConfig[]): void {
    const steps: StepMeta[] = configs.map((config, i) => ({
      ...config,
      isCompleted: false,
      isCurrent: i === 0,
      isAccessible: i === 0,
    }));
    this._steps.set(steps);
    this._currentStepIndex.set(0);
    this._isDirty.set(false);
    this._isCurrentStepValid.set(false);
    this._submitResult.set(null);
    this.clearError();
  }

  /** Called by shell to sync current step when URL changes. */
  setCurrentStepFromPath(path: string): void {
    const steps = this._steps();
    const idx = steps.findIndex(s => s.path === path);
    if (idx === -1 || idx === this._currentStepIndex()) return;
    this._currentStepIndex.set(idx);
    this._steps.update(list =>
      list.map((step, i) => ({ ...step, isCurrent: i === idx }))
    );
    // Reset validity for the newly activated step; step component will re-set it.
    this._isCurrentStepValid.set(false);
    this._isDirty.set(false);
  }

  /** Step components call this to report form validity. */
  setCurrentStepValid(valid: boolean): void {
    this._isCurrentStepValid.set(valid);
  }

  /**
   * Mark current step as dirty (user changed data).
   * Invalidates completion status of current and subsequent steps.
   */
  setDirty(dirty: boolean): void {
    this._isDirty.set(dirty);
    if (dirty) {
      const idx = this._currentStepIndex();
      this._steps.update(list => {
        const updated = list.map((step, i) =>
          i < idx ? step : { ...step, isCompleted: false }
        );
        // Recompute accessibility
        return updated.map((step, i) => ({
          ...step,
          isAccessible: i === 0 || (updated[i - 1]?.isCompleted ?? false),
        }));
      });
    }
  }

  /** Sync form data without marking dirty (called by step components on each valid change). */
  updateStepData(data: Partial<TData>): void {
    this._formData.update(d => ({ ...d, ...data }));
  }

  /** Mark current step as completed and unlock next step. */
  completeCurrentStep(data?: Partial<TData>): void {
    if (data) {
      this._formData.update(d => ({ ...d, ...data }));
    }
    const idx = this._currentStepIndex();
    this._steps.update(list => {
      const updated = list.map((step, i) =>
        i === idx ? { ...step, isCompleted: true } : step
      );
      return updated.map((step, i) => ({
        ...step,
        isAccessible: i === 0 || (updated[i - 1]?.isCompleted ?? false),
      }));
    });
    this._isDirty.set(false);
  }

  setSubmitResult(result: SubmitResult): void {
    this._submitResult.set(result);
  }

  reset(): void {
    this._formData.set({});
    this._isDirty.set(false);
    this._isCurrentStepValid.set(false);
    this._submitResult.set(null);
    this._currentStepIndex.set(0);
    this._steps.update(list =>
      list.map((step, i) => ({
        ...step,
        isCompleted: false,
        isCurrent: i === 0,
        isAccessible: i === 0,
      }))
    );
    this.clearError();
  }
}
