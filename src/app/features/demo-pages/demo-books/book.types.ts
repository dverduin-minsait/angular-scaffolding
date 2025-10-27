/**
 * Demo Book Entity Types
 * Used for testing the Generic CRUD System
 */

export interface BookApi {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  price: number;
  inStock: boolean;
  publishedDate: string;
  description?: string;
  rating: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown; // Index signature for CrudEntity compatibility
}

export interface BookForm {
  title: string;
  author: string;
  isbn: string;
  category: string;
  price: number;
  inStock: boolean;
  publishedDate: string;
  description?: string;
  rating: number;
}

export interface BookFilter {
  title?: string;
  author?: string;
  category?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}