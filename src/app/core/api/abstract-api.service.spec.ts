import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AbstractApiClient } from './abstract-api.service';
import { EntityStore } from '../store/entity-store';
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';

interface TestItem {
  id: number;
  name: string;
  value?: number;
}

// Concrete implementation for testing the abstract base service
@Injectable()
class TestApiService extends AbstractApiClient<TestItem, number> {
  protected readonly baseUrl = '/api';
  protected readonly resourceName = 'items';
}

describe('AbstractApiClient + EntityStore integration', () => {
  let api: TestApiService;
  let store: EntityStore<TestItem, number>;
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

    api = TestBed.inject(TestApiService);
    store = new EntityStore<TestItem, number>(api);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function expectLoading(isLoading: boolean, operation?: string) {
    expect(store.loading().isLoading).toBe(isLoading);
    if (operation) {
      expect(store.loading().operation).toBe(operation as any);
    }
  }

  it('should start with empty state', () => {
    expect(store.items()).toEqual([]);
    expect(store.selected()).toBeNull();
    expect(store.error()).toBeNull();
    expect(store.lastUpdated()).toBeNull();
    expect(store.hasData()).toBe(false);
    expect(store.isEmpty()).toBe(true);
    expect(store.isReady()).toBe(true); // no loading, no error
  });

  describe('getAll()', () => {
    it('should fetch and populate items; update signals', () => {
  const obs = store.loadAll();
  expectLoading(true, 'read');

  let emitted: TestItem[] | undefined;
  obs.subscribe(data => emitted = data);

      const req = httpMock.expectOne('/api/items');
      expect(req.request.method).toBe('GET');
      req.flush(sampleItems);

      expect(emitted).toEqual(sampleItems);
      expectLoading(false);
      expect(store.items()).toEqual(sampleItems);
      expect(store.hasData()).toBe(true);
      expect(store.isEmpty()).toBe(false);
      expect(store.lastUpdated()).not.toBeNull();
      expect(store.isReady()).toBe(true);
    });

    it('should set error signal on failure', () => {
      store.loadAll().subscribe({
        next: () => fail('Expected error'),
        error: err => {
          expect(err).toBeTruthy();
          expect(err.message).toContain('Server exploded');
        }
      });
      const req = httpMock.expectOne('/api/items');
      req.flush({ message: 'Server exploded' }, { status: 500, statusText: 'Server Error' });

      expectLoading(false);
      expect(store.error()).toBeTruthy();
      expect(store.error()!.code).toBe('500');
      expect(store.isReady()).toBe(false); // error present
    });
  });

  describe('create()', () => {
    it('should POST and append new item', () => {
      // Seed existing data
      store.loadAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);

      const newItem: TestItem = { id: 3, name: 'Gamma', value: 30 };
      store.create({ name: 'Gamma', value: 30 }).subscribe(created => {
        expect(created).toEqual(newItem);
      });
      expectLoading(true, 'create');
      const req = httpMock.expectOne('/api/items');
      expect(req.request.method).toBe('POST');
      req.flush(newItem);

      expectLoading(false);
      expect(store.items().length).toBe(3);
      expect(store.items()[2]).toEqual(newItem);
      expect(store.hasData()).toBe(true);
      expect(store.lastUpdated()).not.toBeNull();
    });

    it('should set error on POST failure and not mutate list', () => {
      // Seed
      store.loadAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);
      const before = [...store.items()];
      const beforeUpdatedAt = store.lastUpdated();

      store.create({ name: 'Broken' }).subscribe({
        next: () => fail('expected error'),
        error: err => {
          expect(err.code).toBe('400');
          expect(err.message).toContain('Bad create');
        }
      });
      const req = httpMock.expectOne('/api/items');
      req.flush({ message: 'Bad create' }, { status: 400, statusText: 'Bad Request' });

      expect(store.items()).toEqual(before); // unchanged
      expect(store.error()).toBeTruthy();
      expect(store.loading().isLoading).toBe(false);
      // lastUpdated should not change on failure
      expect(store.lastUpdated()).toBe(beforeUpdatedAt);
    });
  });

  describe('getById()', () => {
    it('should fetch item and set selectedItem; update existing list entry', () => {
      // Seed list
  store.loadAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);

      const updated = { id: 2, name: 'Beta (updated)', value: 99 };
      store.loadOne(2).subscribe(item => {
        expect(item).toEqual(updated);
      });
      expectLoading(true, 'read');
      const req = httpMock.expectOne('/api/items/2');
      expect(req.request.method).toBe('GET');
      req.flush(updated);

      expectLoading(false);
      expect(store.selected()).toEqual(updated);
      // Ensure list got updated (id 2 replaced)
      expect(store.items().find(i => i.id === 2)).toEqual(updated);
    });

    it('should set error on getById failure and not alter items', () => {
      // Seed
      store.loadAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);
      const before = [...store.items()];
      const beforeSelected = store.selected();
      const beforeUpdatedAt = store.lastUpdated();

      store.loadOne(999).subscribe({
        next: () => fail('expected error'),
        error: err => {
          expect(err.code).toBe('404');
        }
      });
      const req = httpMock.expectOne('/api/items/999');
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

      expect(store.items()).toEqual(before);
      expect(store.selected()).toEqual(beforeSelected);
      expect(store.error()).toBeTruthy();
      expect(store.lastUpdated()).toBe(beforeUpdatedAt); // unchanged
    });
  });

  describe('update()', () => {
    it('should PUT and update list & selectedItem when selected matches', () => {
      // Seed data
  store.loadAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);

      // Select item 1
  store.setSelected(sampleItems[0]);
  expect(store.selected()!.id).toBe(1);

      const updated = { id: 1, name: 'Alpha++', value: 111 };
      store.update(1, { name: 'Alpha++', value: 111 }).subscribe(resp => {
        expect(resp).toEqual(updated);
      });
      expectLoading(true, 'update');
      const req = httpMock.expectOne('/api/items/1');
      expect(req.request.method).toBe('PUT');
      req.flush(updated);

      expectLoading(false);
      // List updated
      expect(store.items()[0]).toEqual(updated);
      // Selected updated too
      expect(store.selected()).toEqual(updated);
    });

    it('should set error on PUT failure and keep previous data', () => {
      // Seed data
      store.loadAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);
      const before = [...store.items()];
      store.setSelected(sampleItems[0]);
      const beforeSelected = store.selected();
      const beforeUpdatedAt = store.lastUpdated();

      store.update(1, { name: 'Fail' }).subscribe({
        next: () => fail('expected error'),
        error: err => {
          expect(err.code).toBe('500');
          expect(err.message).toContain('Update failed');
        }
      });
      const req = httpMock.expectOne('/api/items/1');
      req.flush({ message: 'Update failed' }, { status: 500, statusText: 'Server Error' });

      expect(store.items()).toEqual(before);
      expect(store.selected()).toEqual(beforeSelected);
      expect(store.error()).toBeTruthy();
      expect(store.lastUpdated()).toBe(beforeUpdatedAt);
    });
  });

  describe('delete()', () => {
    it('should DELETE and remove from list; clear selection if deleted', () => {
      // Seed list
      store.loadAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);
      // Select id 2
      store.setSelected(sampleItems[1]);
      expect(store.selected()!.id).toBe(2);

      store.delete(2).subscribe(() => {
        // nothing to assert inside here specifically
      });
      expectLoading(true, 'delete');
      const req = httpMock.expectOne('/api/items/2');
      expect(req.request.method).toBe('DELETE');
      req.flush({});

      expectLoading(false);
      expect(store.items().some(i => i.id === 2)).toBe(false);
      expect(store.selected()).toBeNull();
    });

    it('should set error on DELETE failure and keep item & selection', () => {
      // Seed
      store.loadAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);
      store.setSelected(sampleItems[1]);
      const before = [...store.items()];
      const beforeSelected = store.selected();
      const beforeUpdatedAt = store.lastUpdated();

      store.delete(2).subscribe({
        next: () => fail('expected error'),
        error: err => {
          expect(err.code).toBe('503');
        }
      });
      const req = httpMock.expectOne('/api/items/2');
      req.flush({ message: 'Deletion unavailable' }, { status: 503, statusText: 'Service Unavailable' });

      expect(store.items()).toEqual(before);
      expect(store.selected()).toEqual(beforeSelected);
      expect(store.error()).toBeTruthy();
      expect(store.lastUpdated()).toBe(beforeUpdatedAt);
    });
  });

  describe('refresh()', () => {
    it('should call getAll()', () => {
      // Spy on getAll to ensure refresh delegates
      const spy = vi.spyOn(api, 'getAll');
      store.refresh().subscribe();
      const req = httpMock.expectOne('/api/items');
      req.flush(sampleItems);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear()', () => {
    it('should reset state signals', () => {
      // Seed data
      store.loadAll().subscribe();
      httpMock.expectOne('/api/items').flush(sampleItems);
      store.setSelected(sampleItems[0]);

      store.clearAll();
      expect(store.items()).toEqual([]);
      expect(store.selected()).toBeNull();
      expect(store.error()).toBeNull();
      expect(store.lastUpdated()).toBeNull();
      expect(store.isEmpty()).toBe(true);
    });
  });

  describe('handleError()', () => {
    // We call the protected method via index access to validate branch logic
  const invokeHandleError = (err: HttpErrorResponse) => (api as any).handleError(err);

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
      // api client no longer stores error signal; just ensure object shape
  // assertion covered inside error callback above
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
          expect(apiError.message).toBe('Unexpected error');
          expect(apiError.code).toBe('UNKNOWN');
        }
      });
    });
  });
});
