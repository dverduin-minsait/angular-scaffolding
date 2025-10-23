import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { AbstractApiClient } from '../../core/api/abstract-api.service';
import { BookApi } from './book.types';

/**
 * Demo Book API Service
 * Mock implementation for testing Generic CRUD System
 */
@Injectable({
  providedIn: 'root'
})
export class BookApiService extends AbstractApiClient<BookApi, number> {
  protected readonly baseUrl = 'http://localhost:3000/api';
  protected readonly resourceName = 'books';

  // Mock data for demo
  private mockBooks: BookApi[] = [
    {
      id: 1,
      title: 'The Clean Code',
      author: 'Robert C. Martin',
      isbn: '978-0132350884',
      category: 'Programming',
      price: 45.99,
      inStock: true,
      publishedDate: '2008-08-01',
      description: 'A handbook of agile software craftsmanship',
      rating: 4.8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      title: 'Angular in Action',
      author: 'Jeremy Wilken',
      isbn: '978-1617293313',
      category: 'Programming',
      price: 39.99,
      inStock: true,
      publishedDate: '2018-03-15',
      description: 'Complete guide to Angular development',
      rating: 4.2,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    },
    {
      id: 3,
      title: 'Design Patterns',
      author: 'Gang of Four',
      isbn: '978-0201633610',
      category: 'Programming',
      price: 54.99,
      inStock: false,
      publishedDate: '1994-10-21',
      description: 'Elements of reusable object-oriented software',
      rating: 4.9,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z'
    },
    {
      id: 4,
      title: 'The Art of War',
      author: 'Sun Tzu',
      isbn: '978-1599869773',
      category: 'Philosophy',
      price: 12.99,
      inStock: true,
      publishedDate: '-500-01-01',
      description: 'Ancient Chinese military treatise',
      rating: 4.5,
      createdAt: '2024-01-04T00:00:00Z',
      updatedAt: '2024-01-04T00:00:00Z'
    },
    {
      id: 5,
      title: 'JavaScript: The Good Parts',
      author: 'Douglas Crockford',
      isbn: '978-0596517748',
      category: 'Programming',
      price: 29.99,
      inStock: true,
      publishedDate: '2008-05-08',
      description: 'Unearthing the excellence in JavaScript',
      rating: 4.1,
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-01-05T00:00:00Z'
    }
  ];

  private currentId = 6;

  // Override methods to use mock data
  override getAll(): Observable<BookApi[]> {
    return of([...this.mockBooks]).pipe(delay(500)); // Simulate network delay
  }

  override getById(id: number): Observable<BookApi> {
    const book = this.mockBooks.find(b => b.id === id);
    if (!book) {
      throw new Error(`Book with id ${id} not found`);
    }
    return of({ ...book }).pipe(delay(300));
  }

  override create(payload: Partial<BookApi>): Observable<BookApi> {
    const newBook: BookApi = {
      id: this.currentId++,
      title: payload.title || '',
      author: payload.author || '',
      isbn: payload.isbn || '',
      category: payload.category || '',
      price: payload.price || 0,
      inStock: payload.inStock !== undefined ? payload.inStock : true,
      publishedDate: payload.publishedDate || new Date().toISOString().split('T')[0],
      description: payload.description || '',
      rating: payload.rating || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockBooks.push(newBook);
    return of({ ...newBook }).pipe(delay(400));
  }

  override update(id: number, payload: Partial<BookApi>): Observable<BookApi> {
    const index = this.mockBooks.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error(`Book with id ${id} not found`);
    }

    const updatedBook = {
      ...this.mockBooks[index],
      ...payload,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    this.mockBooks[index] = updatedBook;
    return of({ ...updatedBook }).pipe(delay(400));
  }

  override delete(id: number): Observable<void> {
    const index = this.mockBooks.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error(`Book with id ${id} not found`);
    }

    this.mockBooks.splice(index, 1);
    return of(undefined).pipe(delay(300));
  }

  // Additional demo methods
  searchBooks(query: string): Observable<BookApi[]> {
    const filtered = this.mockBooks.filter(book =>
      book.title.toLowerCase().includes(query.toLowerCase()) ||
      book.author.toLowerCase().includes(query.toLowerCase()) ||
      book.category.toLowerCase().includes(query.toLowerCase())
    );
    return of([...filtered]).pipe(delay(300));
  }

  getBooksByCategory(category: string): Observable<BookApi[]> {
    const filtered = this.mockBooks.filter(book => book.category === category);
    return of([...filtered]).pipe(delay(300));
  }
}