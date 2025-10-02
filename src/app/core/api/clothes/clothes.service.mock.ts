import { Observable } from "rxjs";
import { ApiMockUtil } from "../../../testing/api.mock.util";
import { CrudDataSource } from "../abstract-api.service";
import { ClothingItemApi } from "./clothes";

export class ClothesApiMock implements CrudDataSource<ClothingItemApi, number> {
  private mockUtil = ApiMockUtil<ClothingItemApi>([clotheItemMock]);
  
  getAll() {
    return this.mockUtil.getAll();
  }
  getById(id: number) {
    return this.mockUtil.getById(id);
  }
  create(payload: Partial<ClothingItemApi>) {
    return this.mockUtil.create(payload);
  }
  update(id: number, payload: Partial<ClothingItemApi>): Observable<ClothingItemApi> {
    return this.mockUtil.update(id, payload) as Observable<ClothingItemApi>;
  }
  delete(id: number) {
    return this.mockUtil.delete(id) as Observable<void>;
  }
}

export const clotheItemMock: ClothingItemApi = {
  id: 1, 
  name: 'T-Shirt', 
  brand: 'Nike',
  price: 19.99,
  size: 'M', 
  color: 'Red', 
  stock: 25,
  season: 'Summer',
  category: 'Casual',
  description: 'Comfortable cotton t-shirt perfect for everyday wear',
  imageUrl: 'https://example.com/images/tshirt.jpg',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-20T14:45:00Z'
};