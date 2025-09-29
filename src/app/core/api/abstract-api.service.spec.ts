import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BaseApiService } from './abstract-api.service';
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

interface TestItem {
  id: number;
  name: string;
  value?: number;
}

// Concrete implementation for testing the abstract base service
@Injectable()
class TestApiService extends BaseApiService<TestItem, number> {
  protected readonly baseUrl = '/api';
  protected readonly resourceName = 'items';
}

describe('BaseApiService (abstract) via TestApiService', () => {
  let service: TestApiService;
  let httpMock: HttpTestingController;

  const sampleItems: TestItem[] = [
    { id: 1, name: 'Alpha', value: 10 },
    { id: 2, name: 'Beta', value: 20 }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TestApiService]
    });

    service = TestBed.inject(TestApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function expectLoading(isLoading: boolean, operation?: string) {
    expect(service.loading().isLoading).toBe(isLoading);
    if (operation) {
      expect(service.loading().operation).toBe(operation as any);
    }
  }

  it('should start with empty state', () => {
    expect(service.items()).toEqual([]);
    expect(service.selectedItem()).toBeNull();
    expect(service.error()).toBeNull();
    expect(service.lastUpdated()).toBeNull();
    expect(service.hasData()).toBe(false);
    expect(service.isEmpty()).toBe(true);
    expect(service.isReady()).toBe(true); // no loading, no error
  });

  describe('getAll()', () => {
    it('should fetch and populate items; update signals', () => {
      const obs = service.getAll();
      expectLoading(true, 'read');

      let emitted: TestItem[] | undefined;
      obs.subscribe(data => emitted = data);

      const req = httpMock.expectOne('/api/items');
      expect(req.request.method).toBe('GET');
      req.flush(sampleItems);

      expect(emitted).toEqual(sampleItems);
      expectLoading(false);
      expect(service.items()).toEqual(sampleItems);
      expect(service.hasData()).toBe(true);
      expect(service.isEmpty()).toBe(false);
      expect(service.lastUpdated()).not.toBeNull();
      expect(service.isReady()).toBe(true);
    });

    it('should set error signal on failure', () => {
      service.getAll().subscribe({
        next: () => fail('Expected error'),
        error: err => {
          expect(err).toBeTruthy();
          expect(err.message).toContain('Server exploded');
        }
      });
      const req = httpMock.expectOne('/api/items');
      req.flush({ message: 'Server exploded' }, { status: 500, statusText: 'Server Error' });

      expectLoading(false);
      expect(service.error()).toBeTruthy();
      expect(service.error()!.code).toBe('500');
      expect(service.isReady()).toBe(false); // error present
    });
  });

  describe('create()', () => {
    it('should POST and append new item', () => {
      // Seed existing data
      service.getAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);

      const newItem: TestItem = { id: 3, name: 'Gamma', value: 30 };
      service.create({ name: 'Gamma', value: 30 }).subscribe(created => {
        expect(created).toEqual(newItem);
      });
      expectLoading(true, 'create');
      const req = httpMock.expectOne('/api/items');
      expect(req.request.method).toBe('POST');
      req.flush(newItem);

      expectLoading(false);
      expect(service.items().length).toBe(3);
      expect(service.items()[2]).toEqual(newItem);
      expect(service.hasData()).toBe(true);
      expect(service.lastUpdated()).not.toBeNull();
    });

    it('should set error on POST failure and not mutate list', () => {
      // Seed
      service.getAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);
      const before = [...service.items()];
      const beforeUpdatedAt = service.lastUpdated();

      service.create({ name: 'Broken' }).subscribe({
        next: () => fail('expected error'),
        error: err => {
          expect(err.code).toBe('400');
          expect(err.message).toContain('Bad create');
        }
      });
      const req = httpMock.expectOne('/api/items');
      req.flush({ message: 'Bad create' }, { status: 400, statusText: 'Bad Request' });

      expect(service.items()).toEqual(before); // unchanged
      expect(service.error()).toBeTruthy();
      expect(service.loading().isLoading).toBe(false);
      // lastUpdated should not change on failure
      expect(service.lastUpdated()).toBe(beforeUpdatedAt);
    });
  });

  describe('getById()', () => {
    it('should fetch item and set selectedItem; update existing list entry', () => {
      // Seed list
      service.getAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);

      const updated = { id: 2, name: 'Beta (updated)', value: 99 };
      service.getById(2).subscribe(item => {
        expect(item).toEqual(updated);
      });
      expectLoading(true, 'read');
      const req = httpMock.expectOne('/api/items/2');
      expect(req.request.method).toBe('GET');
      req.flush(updated);

      expectLoading(false);
      expect(service.selectedItem()).toEqual(updated);
      // Ensure list got updated (id 2 replaced)
      expect(service.items().find(i => i.id === 2)).toEqual(updated);
    });

    it('should set error on getById failure and not alter items', () => {
      // Seed
      service.getAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);
      const before = [...service.items()];
      const beforeSelected = service.selectedItem();
      const beforeUpdatedAt = service.lastUpdated();

      service.getById(999).subscribe({
        next: () => fail('expected error'),
        error: err => {
          expect(err.code).toBe('404');
        }
      });
      const req = httpMock.expectOne('/api/items/999');
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

      expect(service.items()).toEqual(before);
      expect(service.selectedItem()).toEqual(beforeSelected);
      expect(service.error()).toBeTruthy();
      expect(service.lastUpdated()).toBe(beforeUpdatedAt); // unchanged
    });
  });

  describe('update()', () => {
    it('should PUT and update list & selectedItem when selected matches', () => {
      // Seed data
      service.getAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);

      // Select item 1
      service.setSelectedItem(sampleItems[0]);
      expect(service.selectedItem()!.id).toBe(1);

      const updated = { id: 1, name: 'Alpha++', value: 111 };
      service.update(1, { name: 'Alpha++', value: 111 }).subscribe(resp => {
        expect(resp).toEqual(updated);
      });
      expectLoading(true, 'update');
      const req = httpMock.expectOne('/api/items/1');
      expect(req.request.method).toBe('PUT');
      req.flush(updated);

      expectLoading(false);
      // List updated
      expect(service.items()[0]).toEqual(updated);
      // Selected updated too
      expect(service.selectedItem()).toEqual(updated);
    });

    it('should set error on PUT failure and keep previous data', () => {
      // Seed data
      service.getAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);
      const before = [...service.items()];
      service.setSelectedItem(sampleItems[0]);
      const beforeSelected = service.selectedItem();
      const beforeUpdatedAt = service.lastUpdated();

      service.update(1, { name: 'Fail' }).subscribe({
        next: () => fail('expected error'),
        error: err => {
          expect(err.code).toBe('500');
          expect(err.message).toContain('Update failed');
        }
      });
      const req = httpMock.expectOne('/api/items/1');
      req.flush({ message: 'Update failed' }, { status: 500, statusText: 'Server Error' });

      expect(service.items()).toEqual(before);
      expect(service.selectedItem()).toEqual(beforeSelected);
      expect(service.error()).toBeTruthy();
      expect(service.lastUpdated()).toBe(beforeUpdatedAt);
    });
  });

  describe('delete()', () => {
    it('should DELETE and remove from list; clear selection if deleted', () => {
      // Seed list
      service.getAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);
      // Select id 2
      service.setSelectedItem(sampleItems[1]);
      expect(service.selectedItem()!.id).toBe(2);

      service.delete(2).subscribe(() => {
        // nothing to assert inside here specifically
      });
      expectLoading(true, 'delete');
      const req = httpMock.expectOne('/api/items/2');
      expect(req.request.method).toBe('DELETE');
      req.flush({});

      expectLoading(false);
      expect(service.items().some(i => i.id === 2)).toBe(false);
      expect(service.selectedItem()).toBeNull();
    });

    it('should set error on DELETE failure and keep item & selection', () => {
      // Seed
      service.getAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);
      service.setSelectedItem(sampleItems[1]);
      const before = [...service.items()];
      const beforeSelected = service.selectedItem();
      const beforeUpdatedAt = service.lastUpdated();

      service.delete(2).subscribe({
        next: () => fail('expected error'),
        error: err => {
          expect(err.code).toBe('503');
        }
      });
      const req = httpMock.expectOne('/api/items/2');
      req.flush({ message: 'Deletion unavailable' }, { status: 503, statusText: 'Service Unavailable' });

      expect(service.items()).toEqual(before);
      expect(service.selectedItem()).toEqual(beforeSelected);
      expect(service.error()).toBeTruthy();
      expect(service.lastUpdated()).toBe(beforeUpdatedAt);
    });
  });

  describe('refresh()', () => {
    it('should call getAll()', () => {
      // Spy on getAll to ensure refresh delegates
      const spy = jest.spyOn(service, 'getAll');
      service.refresh().subscribe();
      const req = httpMock.expectOne('/api/items');
      req.flush(sampleItems);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear()', () => {
    it('should reset state signals', () => {
      // Seed data
      service.getAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);
      service.setSelectedItem(sampleItems[0]);

      service.clear();
      expect(service.items()).toEqual([]);
      expect(service.selectedItem()).toBeNull();
      expect(service.error()).toBeNull();
      expect(service.lastUpdated()).toBeNull();
      expect(service.isEmpty()).toBe(true);
    });
  });

  describe('handleError()', () => {
    // We call the protected method via index access to validate branch logic
    const invokeHandleError = (err: HttpErrorResponse) => (service as any).handleError(err);

    it('should prefer nested error.message and error.code when present', () => {
      const httpErr = new HttpErrorResponse({
        error: { message: 'Nested failure', code: 'E_NEST', details: { foo: 'bar' } },
        status: 400,
        statusText: 'Bad Request',
        url: '/api/items'
      });

      invokeHandleError(httpErr).subscribe({
        next: () => fail('expected error path'),
        error: (apiError: any) => {
          expect(apiError.message).toBe('Nested failure');
          expect(apiError.code).toBe('E_NEST');
          expect(apiError.details).toEqual({ message: 'Nested failure', code: 'E_NEST', details: { foo: 'bar' } });
          expect(typeof apiError.timestamp).toBe('number');
        }
      });
      expect(service.error()!.code).toBe('E_NEST');
    });

    it('should fallback to HttpErrorResponse.message when nested message absent', () => {
      const httpErr = new HttpErrorResponse({
        error: { code: 'NO_MSG' },
        status: 500,
        statusText: 'Server Error',
        url: '/api/items'
      });

      invokeHandleError(httpErr).subscribe({
        next: () => fail('expected error'),
        error: (apiError: any) => {
          // Default HttpErrorResponse message contains status & url
            expect(apiError.message).toContain('/api/items');
            expect(apiError.code).toBe('NO_MSG');
        }
      });
    });

    it('should fallback to status code string when nested code absent', () => {
      const httpErr = new HttpErrorResponse({
        error: { message: 'Missing code' },
        status: 404,
        statusText: 'Not Found',
        url: '/api/items/99'
      });

      invokeHandleError(httpErr).subscribe({
        next: () => fail('expected error'),
        error: (apiError: any) => {
          expect(apiError.message).toBe('Missing code');
          expect(apiError.code).toBe('404');
        }
      });
    });

    it('should fallback to default message & UNKNOWN code when neither nested nor status available', () => {
      const httpErr = new HttpErrorResponse({
        error: {},
        status: 0,
        statusText: '',
        url: '/api/items'
      });
      // Simulate absent top-level message
      (httpErr as any).message = '';
      // Remove status so optional chaining yields undefined
      (httpErr as any).status = undefined;

      invokeHandleError(httpErr).subscribe({
        next: () => fail('expected error'),
        error: (apiError: any) => {
          expect(apiError.message).toBe('An unexpected error occurred');
          expect(apiError.code).toBe('UNKNOWN');
        }
      });
    });
  });
});
