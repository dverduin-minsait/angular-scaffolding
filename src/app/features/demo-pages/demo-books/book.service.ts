import { Injectable } from '@angular/core';
import { AbstractApiClient } from '../../../core/api/abstract-api.service';
import { BookApi } from './book.types';

/**
 * Book API Service
 * Uses json-server backend for CRUD operations
 */
@Injectable({
  providedIn: 'root'
})
export class BookApiService extends AbstractApiClient<BookApi, number> {
  protected readonly baseUrl = 'http://localhost:3000';
  protected readonly resourceName = 'books';
}