// Internal helpers for ModalService to isolate private CDK patching.
// These rely on Angular CDK Dialog internals verified against @angular/cdk v20.x.
// If upgrading CDK, revalidate structure of _containerInstance & overlay ref fields.

import { DialogRef } from '@angular/cdk/dialog';

/** Apply disable-backdrop-close semantics by monkey-patching internal container handlers.
 *  Also sets up a fallback DOM listener (browser only) that is cleaned up by returned disposer.
 */
export function applyDisableBackdropClose(
  ref: DialogRef<any, any>,
  { isBrowser, doc, registerCleanup }: { isBrowser: boolean; doc: Document; registerCleanup(fn: () => void): void }
): void {
  const container: any = (ref as any)._containerInstance;
  if (container) {
    container._config.hasBackdrop = true;
    const orig = container._handleBackdropClick?.bind(container);
    if (orig) {
      container._handleBackdropClick = () => { /* swallowed backdrop click */ };
    }
  }
  if (!isBrowser) return; // No DOM fallback on server
  setTimeout(() => {
    try {
      const overlayRef: any = (ref as any)._overlayRef;
      const backdropEl: HTMLElement | null = overlayRef?._backdropElement ?? doc.querySelector('.cdk-overlay-backdrop');
      if (backdropEl) {
        const handler = (ev: Event) => {
          ev.stopImmediatePropagation();
          ev.stopPropagation();
          ev.preventDefault();
        };
        backdropEl.addEventListener('click', handler, { capture: true });
        registerCleanup(() => backdropEl.removeEventListener('click', handler, { capture: true } as any));
      }
    } catch { /* noop */ }
  }, 0);
}

/** Apply disable-escape-close semantics by wrapping internal keydown handler. */
export function applyDisableEscapeClose(ref: DialogRef<any, any>): void {
  const container: any = (ref as any)._containerInstance;
  if (container) {
    const origKey = container._handleKeydown?.bind(container);
    if (origKey) {
      container._handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          event.preventDefault();
          return; // swallow ESC
        }
        origKey(event);
      };
    }
  }
}
