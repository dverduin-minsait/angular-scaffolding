
export interface ClothingItemApi {
  id: number;
  name: string;
  brand: string;
  price: number;
  size: string;
  color: string;
  stock: number;
  season: string;
  category: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}