import { ClothesApiClient } from "../app/core/api/clothes/clothes.service";
import { ClothesApiMock } from "../app/core/api/clothes/clothes.service.mock";
import { AuthService } from "../app/core/auth/services/auth.service";
import { AuthServiceMock } from "../app/core/auth/services/auth.service.mock";

export const ENVIRONMENT = {
  PRODUCTION: false,
  API_URL: 'http://localhost:3000',
  USE_MOCKS: true,
  ENABLE_LOGGING: true,
  PROVIDERS: [
    {provide: ClothesApiClient, useClass: ClothesApiMock},
    {provide: AuthService, useClass: AuthServiceMock}
  ]
}