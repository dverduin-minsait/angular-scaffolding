import { Observable, of } from "rxjs";

interface WithId {
  id: number;
}

export function ApiMockUtil<T extends WithId>(itemList: T[]): {
  getAll: () => Observable<T[]>;
  getById: (id: number) => Observable<T | null>;
  create: (item: Partial<T>) => Observable<T>;
  update: (id: number, item: Partial<T>) => Observable<T | null>;
  delete: (id: number) => Observable<void>;
} {
  // Generic CRUD API methods that can be used in mock services
  return {
    getAll: (): Observable<T[]> => of(itemList),
    getById: (id: number): Observable<T | null> => of(itemList.find(item => item.id === id) ?? null),
    create: (item: Partial<T>): Observable<T> => {
      const newItem = { ...item, id: Math.floor(Math.random() * 1000) + 1 } as T;
      itemList.push(newItem);
      return of(newItem);
    },
    update: (id: number, item: Partial<T>): Observable<T | null> => {
      const index = itemList.findIndex(item => item.id === id);
      if (index !== -1) {
        itemList[index] = { ...itemList[index], ...item };
        return of(itemList[index]);
      }
      return of(null);
    },
    delete: (id: number): Observable<void> => {
      const index = itemList.findIndex(item => item.id === id);
      if (index !== -1) {
        itemList.splice(index, 1);
        return of(undefined);
      }
      return of(undefined);
    }
  };
}