import { Observable, of } from "rxjs";

export function ApiMockUtil<T>(itemList: T[]) {
  // Generic CRUD API methods that can be used in mock services
  return {
    getAll: (): Observable<T[]> => of(itemList),
    getById: (id: number): Observable<T | null> => of(itemList.find(item => (item as any).id === id) ?? null),
    create: (item: Partial<T>): Observable<T> => {
      const newItem = { ...item, id: Math.floor(Math.random() * 1000) + 1 } as T;
      itemList.push(newItem);
      return of(newItem);
    },
    update: (id: number, item: Partial<T>): Observable<T | null> => {
      const index = itemList.findIndex(item => (item as any).id === id);
      if (index !== -1) {
        itemList[index] = { ...itemList[index], ...item };
        return of(itemList[index]);
      }
      return of(null);
    },
    delete: (id: number): Observable<void> => {
      const index = itemList.findIndex(item => (item as any).id === id);
      if (index !== -1) {
        itemList.splice(index, 1);
        return of(undefined);
      }
      return of(undefined);
    }
  };
}