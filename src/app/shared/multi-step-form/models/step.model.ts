export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'tel'
  | 'select'
  | 'textarea'
  | 'checkbox'
  | 'range';

export interface FieldOption {
  value: string;
  label: string;
}

/** Declarative field configuration used by DynamicStepComponent. */
export interface FieldConfig {
  name: string;
  type: FieldType;
  labelKey: string;
  placeholderKey?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: FieldOption[];
}

/** Step configuration provided via MULTI_STEP_FORM_CONFIG token. */
export interface StepConfig {
  path: string;
  titleKey: string;
  index: number;
}

/** Step runtime state managed by MultiStepFormStore. */
export interface StepMeta extends StepConfig {
  isCompleted: boolean;
  isCurrent: boolean;
  isAccessible: boolean;
}
