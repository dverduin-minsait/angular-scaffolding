import {
  afterNextRender,
  Component,
  ElementRef,
  HostListener,
  Injector,
  Output,
  EventEmitter,
  ViewChild,
  ViewChildren,
  QueryList,
  computed,
  inject,
  input,
  runInInjectionContext,
  signal,
  type InputSignal
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { ButtonDirective } from '../../../directives/button.directive';

export type SelectMultipleColumnDisplay = 'single' | 'multi';

export interface SelectMultipleChangeEvent<Id = unknown> {
  readonly value: readonly Id[];
}

export interface SelectMultipleSearchEvent {
  readonly term: string;
}

let nextUniqueId = 0;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

@Component({
  selector: 'app-select-multiple',
  standalone: true,
  imports: [ButtonDirective],
  templateUrl: './select-multiple.component.html',
  styleUrl: './select-multiple.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: SelectMultipleComponent
    }
  ]
})
export class SelectMultipleComponent implements ControlValueAccessor {
  // Inputs (signal-based)
  readonly items: InputSignal<readonly unknown[]> = input<readonly unknown[]>([]);

  /** Key name to read the option id from (default: `id`). */
  readonly idKey: InputSignal<string> = input<string>('id');

  /** Key name to read the option description from (default: `description`). */
  readonly descriptionKey: InputSignal<string> = input<string>('description');

  /** Optional key name used by the search bar (defaults to `descriptionKey`). */
  readonly searchBarKeyName: InputSignal<string | null> = input<string | null>(null);

  /** Enables the search input in the dropdown panel. */
  readonly searchBar: InputSignal<boolean> = input<boolean>(false);

  /** Display mode: single column (one per row) or multi column grid. */
  readonly columnDisplay: InputSignal<SelectMultipleColumnDisplay> = input<SelectMultipleColumnDisplay>('single');

  /** Shows a "select all" button inside the panel. */
  readonly showSelectAll: InputSignal<boolean> = input<boolean>(false);

  /** Shows a "none" (clear selection) button inside the panel. */
  readonly showSelectNone: InputSignal<boolean> = input<boolean>(false);

  /** Optional placeholder shown when no items are selected. */
  readonly placeholder: InputSignal<string> = input<string>('Select…');

  /** Optional accessible label for the collapsed trigger button. */
  readonly ariaLabel: InputSignal<string> = input<string>('Multiple select');

  /** Optional external label id(s) to use instead of aria-label. */
  readonly ariaLabelledBy: InputSignal<string | null> = input<string | null>(null);

  /** Optional external hint/error id(s) for aria-describedby. */
  readonly ariaDescribedBy: InputSignal<string | null> = input<string | null>(null);

  /** Optional label used for the search input placeholder. */
  readonly searchPlaceholder: InputSignal<string> = input<string>('Search');

  /** Optional labels for panel action buttons. */
  readonly selectAllLabel: InputSignal<string> = input<string>('Select all');
  readonly selectNoneLabel: InputSignal<string> = input<string>('None');

  /** Optional label shown when search yields no matches. */
  readonly noResultsLabel: InputSignal<string> = input<string>('No results');

  /** Optional id for the control (used to generate stable aria ids). */
  readonly controlId: InputSignal<string | null> = input<string | null>(null);

  /** Optional callbacks (for consumers that prefer `onX` handlers instead of outputs). */
  readonly onChange: InputSignal<((event: SelectMultipleChangeEvent) => void) | null> =
    input<((event: SelectMultipleChangeEvent) => void) | null>(null);
  readonly onSearch: InputSignal<((event: SelectMultipleSearchEvent) => void) | null> =
    input<((event: SelectMultipleSearchEvent) => void) | null>(null);
  readonly onOpen: InputSignal<(() => void) | null> = input<(() => void) | null>(null);
  readonly onClose: InputSignal<(() => void) | null> = input<(() => void) | null>(null);
  readonly onSelectAll: InputSignal<(() => void) | null> = input<(() => void) | null>(null);
  readonly onSelectNone: InputSignal<(() => void) | null> = input<(() => void) | null>(null);

  // Outputs (emitted in addition to ControlValueAccessor callbacks)
  @Output() readonly valueChange = new EventEmitter<SelectMultipleChangeEvent>();
  @Output() readonly searchTermChange = new EventEmitter<SelectMultipleSearchEvent>();
  @Output() readonly opened = new EventEmitter<void>();
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly selectAllTriggered = new EventEmitter<void>();
  @Output() readonly selectNoneTriggered = new EventEmitter<void>();

  private readonly injector = inject(Injector);
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  @ViewChild('trigger', { read: ElementRef })
  private readonly triggerRef?: ElementRef<HTMLButtonElement>;

  @ViewChild('searchInput', { read: ElementRef })
  private readonly searchInputRef?: ElementRef<HTMLInputElement>;

  @ViewChildren('optionButton', { read: ElementRef })
  private readonly optionButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  protected readonly isOpen = signal(false);
  protected readonly isDisabled = signal(false);

  private readonly selectedIdsWritable = signal<readonly unknown[]>([]);
  protected readonly selectedIds = this.selectedIdsWritable.asReadonly();

  protected readonly searchTermWritable = signal('');
  protected readonly searchTerm = this.searchTermWritable.asReadonly();

  private readonly activeIndexWritable = signal(0);
  protected readonly activeIndex = this.activeIndexWritable.asReadonly();

  protected readonly baseId = computed(() => {
    const provided = this.controlId();
    if (provided) return provided;
    return `select-multiple-${++nextUniqueId}`;
  });

  protected readonly listboxId = computed(() => `${this.baseId()}-listbox`);
  protected readonly optionDomId = (id: unknown): string => `${this.baseId()}-opt-${String(id)}`;

  private readonly searchKey = computed(() => this.searchBarKeyName() ?? this.descriptionKey());

  protected readonly visibleItems = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase();
    const items = this.items();
    if (!term) return items;

    const key = this.searchKey();
    return items.filter(item => {
      const value = this.readText(item, key);
      return value.toLocaleLowerCase().includes(term);
    });
  });

  protected readonly selectedLabels = computed(() => {
    const items = this.items();
    const selected = this.selectedIds();
    if (!selected.length) return '';

    const labelKey = this.descriptionKey();
    const selectedItems = items.filter(it => selected.some(id => Object.is(id, this.readId(it))));
    const labels = selectedItems.map(it => this.readText(it, labelKey));

    if (labels.length <= 2) return labels.join(', ');
    const head = labels.slice(0, 2).join(', ');
    return `${head} +${labels.length - 2}`;
  });

  // CVA callbacks
  private propagateChange: (value: unknown) => void = () => undefined;
  private propagateTouched: () => void = () => undefined;

  constructor() {}

  writeValue(value: unknown): void {
    if (!value) {
      this.selectedIdsWritable.set([]);
      return;
    }

    if (Array.isArray(value)) {
      this.selectedIdsWritable.set((value as unknown[]).slice());
      return;
    }

    // Defensive: accept a single id.
    this.selectedIdsWritable.set([value]);
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.propagateTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
    if (isDisabled) {
      this.closePanel(false);
    }
  }

  protected toggleOpen(): void {
    if (this.isDisabled()) return;

    if (this.isOpen()) {
      this.closePanel(true);
    } else {
      this.openPanel();
    }
  }

  protected openPanel(): void {
    if (this.isDisabled()) return;
    if (this.isOpen()) return;

    this.isOpen.set(true);
    this.activeIndexWritable.set(0);
    this.opened.emit();
    this.onOpen()?.();

    runInInjectionContext(this.injector, () =>
      afterNextRender(() => {
        if (!this.isOpen()) return;

        if (this.searchBar()) {
          this.searchInputRef?.nativeElement?.focus();
          return;
        }

        this.focusActiveOption();
      })
    );
  }

  protected closePanel(restoreFocus: boolean): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.searchTermWritable.set('');
    this.propagateTouched();
    this.closed.emit();
    this.onClose()?.();

    if (restoreFocus) {
      queueMicrotask(() => this.triggerRef?.nativeElement?.focus());
    }
  }

  protected handleTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.openPanel();
        break;
      case 'Escape':
        event.preventDefault();
        this.closePanel(true);
        break;
      default:
        break;
    }
  }

  protected handlePanelKeydown(event: KeyboardEvent): void {
    if (!this.isOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closePanel(true);
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') {
      return;
    }

    const buttons = this.optionButtons?.toArray().map(r => r.nativeElement) ?? [];
    if (!buttons.length) return;

    const activeEl = document.activeElement as HTMLElement | null;
    const isSearchInputFocused = !!this.searchInputRef?.nativeElement && activeEl === this.searchInputRef.nativeElement;
    const indexFromDom = buttons.findIndex(btn => btn === activeEl);
    const currentIndex = indexFromDom >= 0 ? indexFromDom : this.activeIndex();

    const clampIndex = (value: number): number => Math.max(0, Math.min(value, buttons.length - 1));

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        if (isSearchInputFocused) {
          nextIndex = 0;
        } else {
          nextIndex = clampIndex((currentIndex < 0 ? -1 : currentIndex) + 1);
        }
        break;
      case 'ArrowUp':
        if (isSearchInputFocused) {
          nextIndex = buttons.length - 1;
        } else {
          nextIndex = clampIndex((currentIndex < 0 ? buttons.length : currentIndex) - 1);
        }
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = buttons.length - 1;
        break;
      default:
        break;
    }

    event.preventDefault();
    this.activeIndexWritable.set(nextIndex);
    buttons[nextIndex]?.focus();
  }

  protected handleSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const term = target?.value ?? '';
    this.searchTermWritable.set(term);
    this.activeIndexWritable.set(0);
    const payload: SelectMultipleSearchEvent = { term };
    this.searchTermChange.emit(payload);
    this.onSearch()?.(payload);
    queueMicrotask(() => {
      if (!this.isOpen()) return;
      if (this.searchBar()) return; // keep focus if user is typing
      this.focusActiveOption();
    });
  }

  protected isSelected(item: unknown): boolean {
    const id = this.readId(item);
    return this.selectedIds().some(selectedId => Object.is(selectedId, id));
  }

  protected toggleItem(item: unknown): void {
    if (this.isDisabled()) return;

    const id = this.readId(item);
    const prev = this.selectedIds();

    const exists = prev.some(x => Object.is(x, id));
    const next = exists ? prev.filter(x => !Object.is(x, id)) : [...prev, id];

    this.selectedIdsWritable.set(next);
    this.propagateChange(next);
    const payload: SelectMultipleChangeEvent = { value: next };
    this.valueChange.emit(payload);
    this.onChange()?.(payload);
  }

  protected selectAllVisible(): void {
    if (this.isDisabled()) return;

    const ids = this.visibleItems().map(it => this.readId(it));
    const next = [...ids];

    this.selectedIdsWritable.set(next);
    this.propagateChange(next);
    this.selectAllTriggered.emit();
    this.onSelectAll()?.();
    const payload: SelectMultipleChangeEvent = { value: next };
    this.valueChange.emit(payload);
    this.onChange()?.(payload);
  }

  protected clearSelection(): void {
    if (this.isDisabled()) return;

    this.selectedIdsWritable.set([]);
    this.propagateChange([]);
    this.selectNoneTriggered.emit();
    this.onSelectNone()?.();
    const payload: SelectMultipleChangeEvent = { value: [] };
    this.valueChange.emit(payload);
    this.onChange()?.(payload);
  }

  // Close on outside click
  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;

    const target = event.target as Node | null;
    if (!target) return;

    const host = this.hostRef.nativeElement;
    if (!host.contains(target)) {
      this.closePanel(false);
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    if (!this.isOpen()) return;

    const next = event.relatedTarget as Node | null;
    const host = this.hostRef.nativeElement;
    if (next && host.contains(next)) return;

    this.closePanel(false);
  }

  private readId(item: unknown): unknown {
    const record = asRecord(item);
    if (!record) return item;

    const key = this.idKey();
    if (key in record) return record[key];
    return item;
  }

  private readText(item: unknown, key: string): string {
    const record = asRecord(item);
    if (!record) {
      if (typeof item === 'string') return item;
      if (typeof item === 'number') return String(item);
      if (typeof item === 'boolean') return item ? 'true' : 'false';
      return '';
    }

    const value = key in record ? record[key] : undefined;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return value == null ? '' : '';
  }

  protected itemId(item: unknown): string {
    return String(this.readId(item));
  }

  protected itemLabel(item: unknown): string {
    return this.readText(item, this.descriptionKey());
  }

  protected optionTabIndexFor(item: unknown): number {
    const items = this.visibleItems();
    const idx = items.indexOf(item);
    if (idx < 0) return -1;
    return idx === this.activeIndex() ? 0 : -1;
  }

  protected setActiveByItem(item: unknown): void {
    const idx = this.visibleItems().indexOf(item);
    if (idx >= 0) this.activeIndexWritable.set(idx);
  }

  private focusActiveOption(): void {
    const idx = this.activeIndex();
    const btn = this.optionButtons?.get(idx)?.nativeElement;
    btn?.focus();
  }
}
