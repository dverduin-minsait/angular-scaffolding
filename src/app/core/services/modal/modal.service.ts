import { Injectable, inject, signal, Signal, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { applyDisableBackdropClose, applyDisableEscapeClose } from './modal-internals';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

// CDK internal type interfaces (for accessing private APIs)
interface CdkDialogRef {
  _containerInstance?: {
    _elementRef?: {
      nativeElement?: HTMLElement;
    };
  };
  _overlayRef?: {
    _overlayElement?: {
      querySelector?(selector: string): HTMLElement | null;
    };
  };
}

// Result metadata
export interface ModalResult<T = unknown> {
  reason: 'close' | 'cancel' | 'dismiss';
  data?: T;
}

// Open options with accessible helpers
export interface OpenModalOptions<TData = unknown> extends Omit<DialogConfig<TData, unknown>, 'data'> {
  data?: TData;
  labelledBy?: string;       // id of heading element
  describedBy?: string;      // id of descriptive text
  ariaLabel?: string;        // fallback accessible name when no heading id
  disableBackdropClose?: boolean;
  disableEscapeClose?: boolean;
  // Size variant (applied as data-size attribute on the panel for CSS selectors)
  size?: 'sm' | 'md' | 'lg' | 'xl';
  // Tone / semantic variant (drives accent bar + title color). Purely visual.
  tone?: 'warning' | 'error' | 'success' | 'info';
  // Auto close helpers
  autoCloseAfter?: number; // ms until auto close
  autoCloseReason?: 'close' | 'cancel' | 'dismiss';
  autoCloseData?: unknown; // data when reason === 'close'
  // Singleton key; if provided and still open, returns existing instance instead of opening a new one
  singletonKey?: string;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly dialog = inject(Dialog);
  private readonly activeByKey = new Map<string, ModalRef<unknown>>();
  private readonly platformId = inject(PLATFORM_ID);
  private get isBrowser(): boolean { return isPlatformBrowser(this.platformId); }
  private readonly doc: Document = inject(DOCUMENT);

  open<TComponent, TData = unknown, TResult = unknown>(
    component: TComponent,
    options: OpenModalOptions<TData> = {}
  ): ModalRef<TResult> {
    const {
      labelledBy,
      describedBy,
      ariaLabel,
      panelClass,
      backdropClass,
      disableBackdropClose,
      disableEscapeClose,
  size,
  tone,
      autoCloseAfter,
      autoCloseReason = 'dismiss',
      autoCloseData,
      singletonKey,
      ...rest
    } = options;

    if (singletonKey) {
      const existing = this.activeByKey.get(singletonKey) as ModalRef<TResult> | undefined;
      if (existing && !existing.isSettled()) {
        return existing;
      }
    }

  const dialogSvc = this.dialog;
  const mergedPanel = [ 'app-modal-panel', panelClass ].flat().filter(Boolean) as string[];
  const mergedBackdrop = [ 'app-modal-backdrop', backdropClass ].flat().filter(Boolean) as string[];
    // Complex CDK Dialog config types - casting as any for type compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const ref = dialogSvc.open(component as any, {
      role: 'dialog',
      ariaModal: true,
      autoFocus: true,
      restoreFocus: true,
      panelClass: mergedPanel.length === 1 ? mergedPanel[0] : mergedPanel,
      backdropClass: mergedBackdrop.length === 1 ? mergedBackdrop[0] : mergedBackdrop,
      ariaLabel: !labelledBy ? ariaLabel : undefined,
      ariaLabelledBy: labelledBy,
      ariaDescribedBy: describedBy,
      ...rest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Track cleanup callbacks (e.g. DOM listeners) to prevent leaks & SSR safety
    const cleanupFns: Array<() => void> = [];

    // Manage default close semantics
    if (disableBackdropClose) {
      if (this.isBrowser) {
        applyDisableBackdropClose(ref, {
          isBrowser: true,
          doc: this.doc,
          registerCleanup: (fn: () => void) => cleanupFns.push(fn)
        });
      }
      // On server: no-op (won't patch or schedule timers)
    }
    if (disableEscapeClose) {
      applyDisableEscapeClose(ref);
    }

  const modalRef = new ModalRef<TResult>(ref);

    if (singletonKey) {
      this.activeByKey.set(singletonKey, modalRef as ModalRef<unknown>);
      // Cleanup when settled
      void modalRef.result().finally(() => this.activeByKey.delete(singletonKey));
    }

    // Auto close (browser only)
    if (this.isBrowser && autoCloseAfter && autoCloseAfter > 0) {
      const timer = setTimeout(() => {
        if (modalRef.isSettled()) return;
        switch (autoCloseReason) {
          case 'close':
            modalRef.close(autoCloseData as TResult | undefined);
            break;
          case 'cancel':
            modalRef.cancel();
            break;
          case 'dismiss':
          default:
            modalRef.dismiss();
            break;
        }
      }, autoCloseAfter);
      cleanupFns.push(() => clearTimeout(timer));
    }

    // Unified cleanup after settlement
    if (cleanupFns.length) {
      void modalRef.result().finally(() => {
        for (const fn of cleanupFns) {
          try { fn(); } catch { /* ignore */ }
        }
      });
    }

    // Apply size / tone + overflow scroll handling (browser only)
    if (this.isBrowser) {
      queueMicrotask(() => {
        try {
          const cdkRef = ref as unknown as CdkDialogRef;
          const panelEl: HTMLElement | undefined = (cdkRef._containerInstance?._elementRef?.nativeElement as HTMLElement)
            || (cdkRef._overlayRef?._overlayElement?.querySelector?.('.app-modal-panel') as HTMLElement)
            || this.doc.querySelector('.app-modal-panel:not([data-modal-bound])') as HTMLElement || undefined;
          if (panelEl) {
            panelEl.setAttribute('data-modal-bound', '');
            if (size) {
              panelEl.setAttribute('data-size', size);
            }
            if (tone) {
              panelEl.setAttribute('data-tone', tone);
            }
            // Enforce max height for potential scrollable panels
            const evaluateOverflow = (): void => {
              // If content height exceeds available height mark scroll class
              const shouldScroll = panelEl.scrollHeight > panelEl.clientHeight;
              panelEl.classList.toggle('app-modal-panel--scroll', shouldScroll);
            };
            evaluateOverflow();
            // Observe resize to re-evaluate (ResizeObserver widely supported)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const w: any = (globalThis as any).window;
             
            if (w && 'ResizeObserver' in w) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              const ro = new w.ResizeObserver(() => evaluateOverflow());
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              ro.observe(panelEl);
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              cleanupFns.push(() => ro.disconnect());
            } else {
              // Fallback: window resize listener
              const onResize = (): void => evaluateOverflow();
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              if (w?.addEventListener) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                w.addEventListener('resize', onResize);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                cleanupFns.push(() => w.removeEventListener('resize', onResize));
              }
            }
          }
        } catch { /* ignore */ }
      });
    }

    return modalRef;
  }

  // Convenience confirm() returning a boolean Promise
  confirm(options: (ConfirmDialogData & Omit<OpenModalOptions<ConfirmDialogData>, 'data'>) & { detailed?: false }): Promise<boolean>;
  confirm(options: (ConfirmDialogData & Omit<OpenModalOptions<ConfirmDialogData>, 'data'>) & { detailed: true }): Promise<{ confirmed: boolean; reason: 'close' | 'cancel' | 'dismiss' }>;
  confirm(options: (ConfirmDialogData & Omit<OpenModalOptions<ConfirmDialogData>, 'data'>) & { detailed?: boolean }): Promise<boolean | { confirmed: boolean; reason: 'close' | 'cancel' | 'dismiss' }> {
    // Complex CDK component type casting - ESLint disabled for necessary any usage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const {
      title,
      message,
      confirmLabel,
      cancelLabel,
      destructive,
      labelledBy,
      ariaLabel,
      describedBy,
      detailed,
      ...rest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = options as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const ref = this.open<boolean, ConfirmDialogData, boolean>(ConfirmDialogComponent as any, {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: { title, message, confirmLabel, cancelLabel, destructive },
      // Prefer explicit ariaLabel; otherwise tie to heading id for screen readers
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      labelledBy: labelledBy ?? (!ariaLabel ? 'confirmDialogTitle' : undefined),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      ariaLabel,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      describedBy: describedBy ?? 'confirmDialogDesc',
      ...rest
    });
    return ref.result().then(r => {
      // Map raw modal result into confirm semantics
      // close + true => confirmed
      // close + false => user clicked cancel button
      // undefined data (close + undefined) OR dismiss => dismiss
      // explicit cancel() => cancel
      if (!detailed) {
        return r.reason === 'close' && !!r.data ? true : false;
      }
      if (r.reason === 'close') {
        if (r.data === true) {
          return { confirmed: true, reason: 'close' as const };
        } else if (r.data === false) {
          return { confirmed: false, reason: 'cancel' as const };
        } else {
          return { confirmed: false, reason: 'dismiss' as const };
        }
      }
      // r.reason cancel | dismiss
      return { confirmed: false, reason: r.reason };
    });
  }
}

export class ModalRef<T = unknown> {
  private readonly _closedSignal = signal<ModalResult<T> | null>(null);
  closed: Signal<ModalResult<T> | null> = this._closedSignal.asReadonly();
  private _resolve?: (value: ModalResult<T>) => void;
  private readonly _resultPromise: Promise<ModalResult<T>>;
  private _settled = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly ref: DialogRef<any, any>) {
    this._resultPromise = new Promise<ModalResult<T>>(res => (this._resolve = res));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ref.closed.subscribe((value: any) => {
      const current = this._closedSignal();
      // Only overwrite if not already cancelled/dismissed
      if (!current || current.reason === 'close') {
        const result: ModalResult<T> = { reason: 'close', data: (value as T) ?? undefined };
        this._closedSignal.set(result);
        this._maybeResolve(result);
      }
    });
  }
  private _maybeResolve(result: ModalResult<T>): void {
    if (this._resolve) {
      this._resolve(result);
      this._resolve = undefined;
    }
    this._settled = true;
  }

  close(data?: T): void { this.ref.close(data); }
  cancel(): void {
    if (this._settled) return;
    const r: ModalResult<T> = { reason: 'cancel' };
    this._closedSignal.set(r);
    this._maybeResolve(r);
    this.ref.close();
  }
  dismiss(): void {
    if (this._settled) return;
    const r: ModalResult<T> = { reason: 'dismiss' };
    this._closedSignal.set(r);
    this._maybeResolve(r);
    this.ref.close();
  }

  // Promise interface for chaining (await ref.result())
  result(): Promise<ModalResult<T>> { return this._resultPromise; }
  // Expose settled state for guards
  isSettled(): boolean { return this._settled; }
}
