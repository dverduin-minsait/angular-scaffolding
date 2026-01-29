import { TestBed } from '@angular/core/testing';
import { ModalService } from './modal.service';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';
import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DialogModule } from '@angular/cdk/dialog';

@Component({
  standalone: true,
  template: `<h2 style="margin:0;font-size:1rem">Final</h2><div data-info-final>Flow complete</div>`
})
class FinalInfoComponent {}

describe('ModalService', () => {
  let service: ModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DialogModule, ConfirmDialogComponent, FinalInfoComponent],
      providers: [ModalService, provideNoopAnimations()]
    });
    service = TestBed.inject(ModalService);
  });

  it('should open a confirm dialog with accessible attributes', () => {
    const ref = service.open(ConfirmDialogComponent, {
      data: { title: 'Delete', message: 'Confirm delete?' } satisfies ConfirmDialogData,
      ariaLabel: 'Delete'
    });
    // allow microtask flush for container creation
    return new Promise(resolve => setTimeout(resolve, 0)).then(() => {
      const container = document.querySelector('[role="dialog"]');
      expect(container).toBeTruthy();
      expect(container?.getAttribute('aria-label')).toBe('Delete');
    });
  });

  it('should emit close result signal when dialog closes with data', () => {
    const ref = service.open(ConfirmDialogComponent, {
      data: { title: 'Test', message: 'Message' } satisfies ConfirmDialogData
    });
    ref.close(true);
    expect(ref.closed()?.data).toBe(true);
    expect(ref.closed()?.reason).toBe('close');
  });

  it('should allow cancel and dismiss semantics', () => {
    const ref = service.open(ConfirmDialogComponent, {
      data: { title: 'Test', message: 'Message' } satisfies ConfirmDialogData
    });
    ref.cancel();
    // Wait microtask for close subscription
    return new Promise(resolve => setTimeout(resolve, 0)).then(() => {
      expect(ref.closed()?.reason).toBe('cancel');
    });
  });

  it('should resolve promise with close data', async () => {
    const ref = service.open(ConfirmDialogComponent, {
      data: { title: 'Promise', message: 'Testing promise' } satisfies ConfirmDialogData
    });
    ref.close(true);
    const result = await ref.result();
    expect(result.reason).toBe('close');
    expect(result.data).toBe(true);
  });

  it('should resolve promise with cancel reason', async () => {
    const ref = service.open(ConfirmDialogComponent, {
      data: { title: 'Promise Cancel', message: 'Cancel test' } satisfies ConfirmDialogData
    });
    ref.cancel();
    const result = await ref.result();
    expect(result.reason).toBe('cancel');
    expect(result.data).toBeUndefined();
  });

  it('confirm() should resolve true when user confirms', async () => {
    const p = service.confirm({ title: 'Delete', message: 'Sure?', confirmLabel: 'Yes', cancelLabel: 'No' });
    // Find the confirm dialog's confirm button and click it
    await new Promise(r => setTimeout(r, 0));
    const buttons = Array.from(document.querySelectorAll('button'));
    const confirmBtn = buttons.find(b => b.textContent?.trim() === 'Yes');
    expect(confirmBtn).toBeTruthy();
    confirmBtn!.click();
    const result = await p;
    expect(result).toBe(true);
  });

  it('confirm() should resolve false when user cancels', async () => {
    const p = service.confirm({ title: 'Delete', message: 'Sure?', confirmLabel: 'Yes', cancelLabel: 'No' });
    await new Promise(r => setTimeout(r, 0));
    const buttons = Array.from(document.querySelectorAll('button'));
    const cancelBtn = buttons.find(b => b.textContent?.trim() === 'No');
    expect(cancelBtn).toBeTruthy();
    cancelBtn!.click();
    const result = await p;
    expect(result).toBe(false);
  });

  describe('async/await orchestration flow', () => {
    const tick = () => new Promise(res => setTimeout(res, 0));

    it('should perform confirm -> preview API -> confirm -> final API -> final info modal (success path)', async () => {
      // Fake API layer
      const api = {
        getImpact: vi.fn(() => new Promise(res => setTimeout(() => res({ count: 3, id: 'preview-1' }), 0))),
        finalize: vi.fn(() => new Promise(res => setTimeout(() => res({ archivedChildren: 2 }), 0)))
      };

      const runFlow = async () => {
        const first = await service.confirm({ title: 'Archive', message: 'Proceed?', confirmLabel: 'Archive', cancelLabel: 'Cancel', destructive: true });
        if (!first) return 'aborted-initial';
  const preview = (await api.getImpact()) as { count: number; id: string };
  const second = await service.confirm({ title: 'Impact', message: `Affects ${preview.count}. Continue?`, confirmLabel: 'Proceed', cancelLabel: 'Back', destructive: true });
        if (!second) return 'aborted-second';
        const result = await api.finalize();
        service.open(FinalInfoComponent, { data: result, ariaLabel: 'Result' });
        return 'done';
      };

      const flowPromise = runFlow();
      // First confirm
      await tick();
      let btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Archive');
      expect(btn).toBeTruthy();
      btn!.click();
      // Poll for second confirm button (Proceed) since multiple async hops (API + dialog open)
      for (let i = 0; i < 8; i++) {
        await tick();
        const candidate = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Proceed');
        if (candidate) { btn = candidate; break; }
      }
      expect(btn && btn.textContent?.trim()).toBe('Proceed');
      btn!.click();
      await tick();
      await tick(); // allow final API + final modal
      const outcome = await flowPromise;
      expect(outcome).toBe('done');
      expect(api.getImpact).toHaveBeenCalledTimes(1);
      expect(api.finalize).toHaveBeenCalledTimes(1);
      // Final info modal present
      const finalEl = document.querySelector('[data-info-final]');
      expect(finalEl).toBeTruthy();
    });

    it('should abort after first confirm cancellation (no APIs called)', async () => {
      const api = { getImpact: vi.fn(), finalize: vi.fn() };
      const runFlow = async () => {
        const first = await service.confirm({ title: 'Archive', message: 'Proceed?', confirmLabel: 'Archive', cancelLabel: 'Cancel' });
        if (!first) return 'aborted-initial';
        const preview = await api.getImpact();
        const second = await service.confirm({ title: 'Impact', message: `Affects ${preview.count}`, confirmLabel: 'Proceed', cancelLabel: 'Back' });
        if (!second) return 'aborted-second';
        await api.finalize();
        return 'done';
      };
      const flowPromise = runFlow();
      await tick();
      // Click Cancel
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Cancel');
      expect(cancelBtn).toBeTruthy();
      cancelBtn!.click();
      const outcome = await flowPromise;
      expect(outcome).toBe('aborted-initial');
      expect(api.getImpact).not.toHaveBeenCalled();
      expect(api.finalize).not.toHaveBeenCalled();
    });
  });

  describe('auto-close behavior', () => {
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    it('should auto close with reason close and provided data', async () => {
      const ref = service.open(ConfirmDialogComponent, {
        data: { title: 'Auto', message: 'Auto close test' } satisfies ConfirmDialogData,
        autoCloseAfter: 25,
        autoCloseReason: 'close',
        autoCloseData: 'done-data'
      });
      const result = await ref.result();
      expect(result.reason).toBe('close');
      expect(result.data).toBe('done-data');
    });

    it('should auto cancel when reason cancel', async () => {
      const ref = service.open(ConfirmDialogComponent, {
        data: { title: 'Auto', message: 'Auto cancel' } satisfies ConfirmDialogData,
        autoCloseAfter: 15,
        autoCloseReason: 'cancel'
      });
      const result = await ref.result();
      expect(result.reason).toBe('cancel');
      expect(result.data).toBeUndefined();
    });

    it('should auto dismiss by default', async () => {
      const ref = service.open(ConfirmDialogComponent, {
        data: { title: 'Auto', message: 'Auto dismiss' } satisfies ConfirmDialogData,
        autoCloseAfter: 15
      });
      const result = await ref.result();
      expect(result.reason).toBe('dismiss');
    });
  });

  describe('singletonKey behavior', () => {
    it('should return existing ref when singletonKey still active and new after settle', async () => {
      const first = service.open(ConfirmDialogComponent, {
        data: { title: 'One', message: 'First' } satisfies ConfirmDialogData,
        singletonKey: 'unique-modal'
      });
      const again = service.open(ConfirmDialogComponent, {
        data: { title: 'Two', message: 'Second' } satisfies ConfirmDialogData,
        singletonKey: 'unique-modal'
      });
      expect(again).toBe(first); // same instance reused
      first.close(true);
      await first.result();
      const third = service.open(ConfirmDialogComponent, {
        data: { title: 'Three', message: 'Third' } satisfies ConfirmDialogData,
        singletonKey: 'unique-modal'
      });
      expect(third).not.toBe(first);
    });
  });

  describe('detailed confirm reasons (cancel vs dismiss)', () => {
    const tick = () => new Promise(r => setTimeout(r, 0));

    it('should differentiate cancel (button) vs dismiss (backdrop)', async () => {
      // Cancel path
      const cancelPromise = service.confirm({
        title: 'Confirm',
        message: 'Cancel me',
        confirmLabel: 'Yes',
        cancelLabel: 'No',
        detailed: true
      });
      await tick();
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'No');
      expect(cancelBtn).toBeTruthy();
      cancelBtn!.click();
      const cancelResult = await cancelPromise as { confirmed: boolean; reason: string };
      expect(cancelResult.confirmed).toBe(false);
      expect(cancelResult.reason).toBe('cancel');

      // Dismiss path (backdrop click)
      const dismissPromise = service.confirm({
        title: 'Confirm',
        message: 'Dismiss me',
        confirmLabel: 'Go',
        cancelLabel: 'Stop',
        detailed: true
      });
      await tick();
      const backdrop = document.querySelector('.cdk-overlay-backdrop');
      expect(backdrop).toBeTruthy();
      backdrop!.click();
      const dismissResult = await dismissPromise as { confirmed: boolean; reason: string };
      expect(dismissResult.confirmed).toBe(false);
      expect(dismissResult.reason).toBe('dismiss');
    });
  });

  describe('keyboard & backdrop interactions', () => {
    const tick = () => new Promise(r => setTimeout(r, 0));

    it('should record close with undefined data (Escape semantic approximation)', async () => {
      // Direct simulation: since accessing private container is unreliable in JSDOM, emulate Escape by closing with undefined.
      const ref = service.open(ConfirmDialogComponent, { data: { title: 'Esc', message: 'Sim' } satisfies ConfirmDialogData });
      ref.close(undefined);
      const result = await ref.result();
      expect(result.reason).toBe('close');
      expect(result.data).toBeUndefined();
    });

    it('should ignore Escape when disableEscapeClose=true', async () => {
      const ref = service.open(ConfirmDialogComponent, {
        data: { title: 'Esc Disable', message: 'Try escape' } satisfies ConfirmDialogData,
        disableEscapeClose: true
      });
      await tick();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await tick();
      expect(ref.isSettled()).toBe(false);
      ref.cancel();
      const result = await ref.result();
      expect(result.reason).toBe('cancel');
    });

    it('should ignore backdrop click when disableBackdropClose=true', async () => {
      const ref = service.open(ConfirmDialogComponent, {
        data: { title: 'Backdrop Disable', message: 'Try backdrop' } satisfies ConfirmDialogData,
        disableBackdropClose: true
      });
      await tick();
      const backdrop = document.querySelector('.cdk-overlay-backdrop');
      expect(backdrop).toBeTruthy();
      backdrop!.click();
      await tick();
      // Should remain unsettled due to interception
      expect(ref.isSettled()).toBe(false);
      ref.dismiss();
      const result = await ref.result();
      expect(result.reason).toBe('dismiss');
    });
  });

  describe('isSettled() behavior', () => {
    const tick = () => new Promise(r => setTimeout(r, 0));

    it('should report settled after close and ignore subsequent cancel()', async () => {
      const ref = service.open(ConfirmDialogComponent, { data: { title: 'Settle', message: 'Close test' } satisfies ConfirmDialogData });
      expect(ref.isSettled()).toBe(false);
      ref.close(true);
      const res = await ref.result();
      expect(ref.isSettled()).toBe(true);
      expect(res.reason).toBe('close');
      // Attempt to cancel after settle
      ref.cancel();
      await tick();
      expect(ref.closed()!.reason).toBe('close'); // unchanged
    });

    it('should report settled after dismiss and ignore subsequent close()', async () => {
      const ref = service.open(ConfirmDialogComponent, { data: { title: 'Settle', message: 'Dismiss test' } satisfies ConfirmDialogData });
      ref.dismiss();
      const res = await ref.result();
      expect(res.reason).toBe('dismiss');
      expect(ref.isSettled()).toBe(true);
      ref.close(true as any);
      await tick();
      expect(ref.closed()!.reason).toBe('dismiss');
    });
  });
});
