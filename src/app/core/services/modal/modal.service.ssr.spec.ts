import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { DialogModule } from '@angular/cdk/dialog';
import { ModalService } from './modal.service';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

// Minimal fake timer tracking by monkey-patching setTimeout in this spec scope
describe('ModalService SSR (server platform)', () => {
  let service: ModalService;
  let originalSetTimeout: any;
  let scheduledFromService: number = 0;

  beforeEach(() => {
  scheduledFromService = 0;
    originalSetTimeout = global.setTimeout;
    (global as any).setTimeout = (fn: any, ms?: number, ...rest: any[]) => {
      const err = new Error();
      const stack = (err.stack || '').toLowerCase();
      if (stack.includes('modal.service.ts') && !stack.includes('modal.service.ssr.spec.ts')) {
        scheduledFromService++;
      }
      return originalSetTimeout(fn, ms, ...rest);
    };

    TestBed.configureTestingModule({
      imports: [DialogModule, ConfirmDialogComponent],
      providers: [
        ModalService,
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });
    service = TestBed.inject(ModalService);
  });

  afterEach(() => {
    (global as any).setTimeout = originalSetTimeout;
  });

  it('should not schedule auto-close timers or DOM listeners when not browser', async () => {
    const ref = service.open(ConfirmDialogComponent, {
      data: { title: 'SSR', message: 'No timers' } satisfies ConfirmDialogData,
      autoCloseAfter: 10,
      disableBackdropClose: true
    });
    // No timers from service expected on server
    expect(scheduledFromService).toBe(0);
    // Close manually to ensure no errors
    ref.close();
    const result = await ref.result();
    expect(result.reason).toBe('close');
  });
});
