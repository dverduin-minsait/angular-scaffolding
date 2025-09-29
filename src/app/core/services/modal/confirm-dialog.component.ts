import { Component, inject } from '@angular/core';
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
  template: `
    <h2 id="confirmDialogTitle" class="modal__title">{{ data.title }}</h2>
    <p id="confirmDialogDesc" class="modal__message">{{ data.message }}</p>
    <div class="modal__actions">
      <button type="button" (click)="onCancel()" class="btn btn-secondary">{{ data.cancelLabel || 'Cancel' }}</button>
      <button type="button" (click)="onConfirm()" class="btn" [class.btn-danger]="data.destructive" [class.btn-primary]="!data.destructive">
        {{ data.confirmLabel || 'OK' }}
      </button>
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
