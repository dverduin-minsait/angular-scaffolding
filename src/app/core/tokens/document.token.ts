import { DOCUMENT } from '@angular/common';
import { InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Injection token for the DOM Document object.
 * This token provides the Document object in browser environments and a minimal
 * implementation in server-side environments.
 */
export const WINDOW_DOCUMENT = new InjectionToken<Document>('WindowDocument', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID);
    const document = inject(DOCUMENT);
    
    if (isPlatformBrowser(platformId)) {
      return document;
    }
    
    // Return the document from @angular/common which handles
    // the server-side case appropriately
    return document;
  }
});