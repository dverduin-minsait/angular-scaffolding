import { Component, inject } from '@angular/core';
import { ButtonDirective } from '../../../shared/directives/button.directive';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-confirm-dialog',
  imports: [ButtonDirective],
  template: `
    <h2 id="confirmDialogTitle" class="modal__title">{{ data.title }}</h2>
    <p id="confirmDialogDesc" class="modal__message">{{ data.message }}</p>
    <div class="modal__actions">
      <button type="button" appButton variant="secondary" (click)="onCancel()">{{ data.cancelLabel || 'Cancel' }}</button>
      <button type="button" appButton [variant]="data.destructive ? 'danger' : 'primary'" (click)="onConfirm()">{{ data.confirmLabel || 'OK' }}</button>
    </div>
  `,
  styles: [`
    :host { display:block; }
  `]
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(DIALOG_DATA);
  private ref = inject<DialogRef<boolean>>(DialogRef as any);

  onConfirm() { this.ref.close(true); }
  onCancel() { this.ref.close(false); }
}
