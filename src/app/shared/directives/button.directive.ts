import { Directive, ElementRef, effect, input, InputSignal } from '@angular/core';

/**
 * Semantic button directive applying standardized classes for variants & sizes.
 * Usage: <button appButton variant="primary" size="md">Save</button>
 * Accepts both native <button> and <a> (adds role/disabled semantics only if needed externally).
 */
@Directive({
  selector: 'button[appButton], a[appButton]',
  standalone: true
})
export class ButtonDirective {
  private host!: HTMLElement;

  variant: InputSignal<'primary' | 'secondary' | 'ghost' | 'danger'> = input<'primary' | 'secondary' | 'ghost' | 'danger'>('primary');
  size: InputSignal<'sm' | 'md' | 'lg'> = input<'sm' | 'md' | 'lg'>('md');

  constructor(private elementRef: ElementRef<HTMLElement>) {
    this.host = this.elementRef.nativeElement as HTMLElement;
    this.host.classList.add('btn');

    let prevVariant: string | null = null;
    let prevSize: string | null = null;

    effect(() => {
      const variant = this.variant();
      const size = this.size();

      // Maps for alias classes expected by legacy/tests
      const variantAlias = (v: string) => `btn-${v}`; // primary -> btn-primary
      const sizeAliasMap: Record<string,string> = { sm: 'btn-small', md: 'btn-medium', lg: 'btn-large' };

      // Remove previously applied variant classes
      if (prevVariant) {
        this.host.classList.remove(`btn--${prevVariant}`);
        this.host.classList.remove(variantAlias(prevVariant));
      }
      if (prevSize) {
        this.host.classList.remove(`btn--${prevSize}`);
        const prevSizeAlias = sizeAliasMap[prevSize];
        if (prevSizeAlias) {
          this.host.classList.remove(prevSizeAlias);
        }
      }

      // Add new BEM + alias classes
      this.host.classList.add(`btn--${variant}`, variantAlias(variant));
      this.host.classList.add(`btn--${size}`);
      const sizeAlias = sizeAliasMap[size];
      if (sizeAlias) {
        this.host.classList.add(sizeAlias);
      }

      prevVariant = variant;
      prevSize = size;
    });
  }
}
