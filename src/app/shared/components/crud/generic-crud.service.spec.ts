import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { GenericCrudService, CrudPreferences } from './generic-crud.service';
import { LOCAL_STORAGE } from '../../../core/tokens/local.storage.token';
import { firstValueFrom } from 'rxjs';

describe('GenericCrudService', () => {
  let service: GenericCrudService;
  let mockLocalStorage: Partial<Storage>;

  beforeEach(async () => {
    // Create a mock localStorage implementation
    const storage: Record<string, string> = {};
    mockLocalStorage = {
      getItem: jest.fn((key: string) => storage[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete storage[key];
      }),
      clear: jest.fn(() => {
        Object.keys(storage).forEach(key => delete storage[key]);
      })
    };

    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        GenericCrudService,
        {
          provide: LOCAL_STORAGE,
          useValue: mockLocalStorage
        }
      ]
    }).compileComponents();

    service = TestBed.inject(GenericCrudService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save preferences to localStorage', async () => {
    const entityName = 'Book';
    const preferences: CrudPreferences = {
      columnVisibility: {
        title: true,
        author: false,
        isbn: true
      }
    };

    await firstValueFrom(service.savePreferences(entityName, preferences));

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'crud-preferences',
      JSON.stringify({ [entityName]: preferences })
    );
  });

  it('should load preferences from localStorage', async () => {
    const entityName = 'Book';
    const preferences: CrudPreferences = {
      columnVisibility: {
        title: true,
        author: false,
        isbn: true
      }
    };

    // Pre-populate localStorage
    const allPreferences = { [entityName]: preferences };
    (mockLocalStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(allPreferences));

    const result = await firstValueFrom(service.loadPreferences(entityName));

    expect(result).toEqual(preferences);
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('crud-preferences');
  });

  it('should return null when no preferences exist', async () => {
    const entityName = 'NonExistent';

    const result = await firstValueFrom(service.loadPreferences(entityName));

    expect(result).toBeNull();
  });

  it('should clear preferences for specific entity', async () => {
    const entityName = 'Book';
    const otherEntity = 'User';
    const preferences: CrudPreferences = {
      columnVisibility: { title: true }
    };

    // Pre-populate localStorage with multiple entities
    const allPreferences = {
      [entityName]: preferences,
      [otherEntity]: preferences
    };
    (mockLocalStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(allPreferences));

    await firstValueFrom(service.clearPreferences(entityName));

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'crud-preferences',
      JSON.stringify({ [otherEntity]: preferences })
    );
  });

  it('should generate default preferences correctly', () => {
    const columnFields = ['title', 'author', 'isbn', 'category'];
    
    const defaults = service.getDefaultPreferences(columnFields);

    expect(defaults).toEqual({
      columnVisibility: {
        title: true,
        author: true,
        isbn: true,
        category: true
      }
    });
  });

  it('should fallback to memory storage when localStorage fails', async () => {
    // Make localStorage throw an error
    (mockLocalStorage.setItem as jest.Mock).mockImplementation(() => {
      throw new Error('localStorage not available');
    });
    (mockLocalStorage.getItem as jest.Mock).mockImplementation(() => {
      throw new Error('localStorage not available');
    });

    const entityName = 'Book';
    const preferences: CrudPreferences = {
      columnVisibility: { title: true, author: false }
    };

    // Save should not throw, but use memory storage
    await expect(firstValueFrom(service.savePreferences(entityName, preferences))).resolves.toBeUndefined();

    // Load should return the saved preferences from memory
    const result = await firstValueFrom(service.loadPreferences(entityName));
    expect(result).toEqual(preferences);
  });

  it('should handle corrupted localStorage data gracefully', async () => {
    const entityName = 'Book';
    
    // Make localStorage return invalid JSON
    (mockLocalStorage.getItem as jest.Mock).mockReturnValue('invalid json');

    const result = await firstValueFrom(service.loadPreferences(entityName));

    expect(result).toBeNull();
  });

  it('should preserve other entity preferences when saving', async () => {
    const entityName1 = 'Book';
    const entityName2 = 'User';
    const preferences1: CrudPreferences = {
      columnVisibility: { title: true, author: false }
    };
    const preferences2: CrudPreferences = {
      columnVisibility: { name: true, email: false }
    };

    // Save first entity
    await firstValueFrom(service.savePreferences(entityName1, preferences1));
    
    // Save second entity
    await firstValueFrom(service.savePreferences(entityName2, preferences2));

    // Verify both are saved
    const expectedStorage = {
      [entityName1]: preferences1,
      [entityName2]: preferences2
    };

    expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith(
      'crud-preferences',
      JSON.stringify(expectedStorage)
    );
  });
});