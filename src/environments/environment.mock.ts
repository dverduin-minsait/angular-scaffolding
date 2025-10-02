import { ClothesApiClient } from "../app/core/api/clothes/clothes.service";
import { ClothesApiMock } from "../app/core/api/clothes/clothes.service.mock";

export const ENVIRONMENT = {
  PRODUCTION: false,
  API_URL: 'http://localhost:3000',
  USE_MOCKS: true,
  ENABLE_LOGGING: true,
  PROVIDERS: [
    {provide: ClothesApiClient, useClass: ClothesApiMock}
  ]
}