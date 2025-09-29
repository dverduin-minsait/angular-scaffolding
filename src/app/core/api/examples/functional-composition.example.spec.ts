import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { runInInjectionContext, EnvironmentInjector } from '@angular/core';
import {
  createApiStore,
  createApiService,
  createGetAll,
  createGetById,
  createPost,
  createPut,
  createDelete,
  createErrorHandler,
  ClothesFunctionalApiService,
  ApiConfig,
  ApiResponse
} from './functional-composition.example';

interface TestItem { id: number; name: string; price?: number; stock?: number; }

describe('Functional Composition API (createApiStore + composables)', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  describe('createApiStore()', () => {
    it('should initialize with empty state & derived flags', () => {
      const store = createApiStore<TestItem>();
      expect(store.items()).toEqual([]);
      expect(store.selectedItem()).toBeNull();
      expect(store.loading().isLoading).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.lastUpdated()).toBeNull();
      expect(store.hasData()).toBe(false);
      expect(store.isEmpty()).toBe(true);
      expect(store.isReady()).toBe(true);
    });

    it('should mutate items and update lastUpdated via set/add/update/remove/clear', () => {
      const store = createApiStore<TestItem>();
      store.setItems([{ id: 1, name: 'A' }]);
      const afterSet = store.lastUpdated();
      expect(store.items().length).toBe(1);
      expect(afterSet).not.toBeNull();
      store.addItem({ id: 2, name: 'B' });
      expect(store.items().length).toBe(2);
      store.setSelectedItem({ id: 2, name: 'B' });
      store.updateItem({ id: 2, name: 'B2' });
      expect(store.items().find(i => i.id === 2)?.name).toBe('B2');
      expect(store.selectedItem()!.name).toBe('B2');
      store.removeItem(1);
      expect(store.items().some(i => i.id === 1)).toBe(false);
      store.clear();
      expect(store.items()).toEqual([]);
      expect(store.lastUpdated()).toBeNull();
      expect(store.isEmpty()).toBe(true);
    });

    it('should set & clear errors', () => {
      const store = createApiStore<TestItem>();
      store.setError({ message: 'X', code: 'C', timestamp: Date.now() });
      expect(store.error()).toBeTruthy();
      store.clearError();
      expect(store.error()).toBeNull();
    });
  });

  describe('Composable CRUD functions', () => {
  const config: ApiConfig = { baseUrl: '/api', resourceName: 'things' };
  let store = createApiStore<TestItem>();

    beforeEach(() => {
      store = createApiStore<TestItem>();
    });

    it('getAll should fetch items and update store', () => {
  const getAll = createGetAll(TestBed.inject(HttpClient), config, store);
      getAll().subscribe(items => expect(items.length).toBe(2));
      const req = httpMock.expectOne('/api/things');
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
      expect(store.items().length).toBe(2);
      expect(store.loading().isLoading).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('getById should map ApiResponse and update selected item', () => {
  const getById = createGetById(TestBed.inject(HttpClient), config, store);
      getById(5).subscribe(item => {
        expect(item.id).toBe(5);
        expect(store.selectedItem()!.id).toBe(5);
      });
      const req = httpMock.expectOne('/api/things/5');
      req.flush(<ApiResponse<TestItem>>{ data: { id: 5, name: 'Five' }, success: true, timestamp: Date.now() });
      expect(store.loading().isLoading).toBe(false);
    });

    it('create should post and append', () => {
      store.setItems([{ id: 1, name: 'A' }]);
  const createFn = createPost(TestBed.inject(HttpClient), config, store);
      createFn({ name: 'B' }).subscribe(item => expect(item.id).toBe(2));
      const req = httpMock.expectOne('/api/things');
      expect(req.request.method).toBe('POST');
      req.flush(<ApiResponse<TestItem>>{ data: { id: 2, name: 'B' }, success: true, timestamp: Date.now() });
      expect(store.items().length).toBe(2);
    });

    it('update should put and replace item', () => {
      store.setItems([{ id: 1, name: 'A' }]);
      store.setSelectedItem({ id: 1, name: 'A' });
  const updateFn = createPut(TestBed.inject(HttpClient), config, store);
      updateFn(1, { name: 'A2' }).subscribe(item => expect(item.name).toBe('A2'));
      const req = httpMock.expectOne('/api/things/1');
      expect(req.request.method).toBe('PUT');
      req.flush(<ApiResponse<TestItem>>{ data: { id: 1, name: 'A2' }, success: true, timestamp: Date.now() });
      expect(store.items()[0].name).toBe('A2');
      expect(store.selectedItem()!.name).toBe('A2');
    });

    it('delete should remove item', () => {
      store.setItems([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
  const deleteFn = createDelete(TestBed.inject(HttpClient), config, store);
      deleteFn(1).subscribe(() => {});
      const req = httpMock.expectOne('/api/things/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(<ApiResponse<void>>{ data: undefined as any, success: true, timestamp: Date.now() });
      expect(store.items().some(i => i.id === 1)).toBe(false);
    });

    it('error handler should set store.error with fallbacks', () => {
      const store2 = createApiStore<TestItem>();
      const handler = createErrorHandler(store2);
      const httpErr = new HttpErrorResponse({ status: 404, statusText: 'NF', error: { message: 'Missing' } });
      handler(httpErr).subscribe({ error: e => {
        expect(e.code).toBe('404');
        expect(store2.error()).toBeTruthy();
      }});
    });
  });

  describe('createApiService integration', () => {
    it('should perform full CRUD flow with signals', () => {
      const env = TestBed.inject(EnvironmentInjector);
      let api: ReturnType<typeof createApiService<TestItem>>;
      runInInjectionContext(env, () => {
        api = createApiService<TestItem>({ baseUrl: '/api', resourceName: 'things' });
      });
      // getAll
      api!.getAll().subscribe(list => expect(list.length).toBe(1));
      httpMock.expectOne('/api/things').flush([{ id: 1, name: 'One' }]);
      expect(api!.items().length).toBe(1);
      // create
      api!.create({ name: 'Two' }).subscribe(item => expect(item.id).toBe(2));
      httpMock.expectOne('/api/things').flush(<ApiResponse<TestItem>>{ data: { id: 2, name: 'Two' }, success: true, timestamp: Date.now() });
      expect(api!.items().length).toBe(2);
      // update
      api!.update(1, { name: 'One+' }).subscribe(updated => expect(updated.name).toBe('One+'));
      httpMock.expectOne('/api/things/1').flush(<ApiResponse<TestItem>>{ data: { id: 1, name: 'One+' }, success: true, timestamp: Date.now() });
      expect(api!.items()[0].name).toBe('One+');
      // delete
      api!.delete(2).subscribe(() => {});
      httpMock.expectOne('/api/things/2').flush(<ApiResponse<void>>{ data: undefined as any, success: true, timestamp: Date.now() });
      expect(api!.items().some(i => i.id === 2)).toBe(false);
      // error path
      api!.getAll().subscribe({ error: e => { expect(e.code).toBe('500'); }});
      httpMock.expectOne('/api/things').flush({ message: 'Boom' }, { status: 500, statusText: 'ERR' });
      expect(api!.error()).toBeTruthy();
    });
  });
});

// ============================================================================
// ClothesFunctionalApiService tests
// ============================================================================

describe('ClothesFunctionalApiService', () => {
  let service: ClothesFunctionalApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClothesFunctionalApiService]
    });
    service = TestBed.inject(ClothesFunctionalApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should load all clothes and compute derived signals', () => {
    service.getAll().subscribe(items => expect(items.length).toBe(3));
    httpMock.expectOne('http://localhost:3000/clothes').flush([
      { id: 1, name: 'Shirt', stock: 5, price: 10 },
      { id: 2, name: 'Pants', stock: 0, price: 30 },
      { id: 3, name: 'Hat', stock: 2, price: 15 }
    ]);
    expect(service.items().length).toBe(3);
    expect(service.availableItems().length).toBe(2);
    expect(service.lowStockItems().some(i => i.id === 3)).toBe(true); // stock 2
    expect(service.totalValue()).toBe((5*10) + (0*30) + (2*15));
  });

  it('should create, update stock via updateStock, and delete', () => {
    // Seed
    service.getAll().subscribe();
    httpMock.expectOne('http://localhost:3000/clothes').flush([]);

    service.create({ name: 'New', stock: 1, price: 50 }).subscribe(item => {
      expect(item.name).toBe('New');
    });
    httpMock.expectOne('http://localhost:3000/clothes').flush(<ApiResponse<any>>{ data: { id: 10, name: 'New', stock: 1, price: 50 }, success: true, timestamp: Date.now() });
    expect(service.items().length).toBe(1);

    service.updateStock(10, 7).subscribe(updated => expect(updated.stock).toBe(7));
    httpMock.expectOne('http://localhost:3000/clothes/10').flush(<ApiResponse<any>>{ data: { id: 10, name: 'New', stock: 7, price: 50 }, success: true, timestamp: Date.now() });
    expect(service.items()[0].stock).toBe(7);

    service.delete(10).subscribe(() => {});
    httpMock.expectOne('http://localhost:3000/clothes/10').flush(<ApiResponse<void>>{ data: undefined as any, success: true, timestamp: Date.now() });
    expect(service.items().length).toBe(0);
  });

  it('should handle getByCategory with ApiResponse mapping', () => {
    service.getByCategory('summer').subscribe(list => {
      expect(list.length).toBe(1);
      expect(service.items().length).toBe(1);
    });
    httpMock.expectOne('https://api.example.com/v1/clothes?category=summer').flush(<ApiResponse<any[]>>{
      data: [{ id: 5, name: 'Summer Hat', stock: 3, price: 25 }],
      success: true,
      timestamp: Date.now()
    });
  });

  it('should set error on failure and recover on subsequent success', () => {
    service.getAll().subscribe({ error: e => expect(e.code).toBe('500') });
    httpMock.expectOne('http://localhost:3000/clothes').flush({ message: 'Fail' }, { status: 500, statusText: 'ERR' });
    expect(service.error()).toBeTruthy();

    // Recovery
    service.getAll().subscribe(items => expect(items.length).toBe(1));
    httpMock.expectOne('http://localhost:3000/clothes').flush([{ id: 2, name: 'Pants', stock: 1, price: 30 }]);
    expect(service.error()).toBeNull();
    expect(service.isReady()).toBe(true);
  });
});
