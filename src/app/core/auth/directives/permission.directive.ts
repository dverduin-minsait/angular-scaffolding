import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AuthStore } from '../stores/auth.store';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly auth = inject(AuthStore);

  private required: string | string[] = '';

  @Input('hasPermission') set setPermission(value: string | string[]) {
    this.required = value;
    this.render();
  }

  constructor() {
    effect(() => {
      // Re-run whenever auth status or user/permissions change
      this.auth.status();
      this.auth.user();
      this.render();
    });
  }

  private render() {
    this.vcr.clear();
    if (this.shouldShow()) {
      this.vcr.createEmbeddedView(this.tpl);
    }
  }

  private shouldShow(): boolean {
    if (!this.auth.isAuthenticated()) return false;
    const user = this.auth.user();
    if (!user) return false;
    const required = this.required;
    if (Array.isArray(required)) {
      return required.some(perm => user.permissions.includes(perm));
    }
    return required === '' || user.permissions.includes(required);
  }
}
