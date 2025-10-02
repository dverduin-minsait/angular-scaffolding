import { Injectable } from "@angular/core";
import { AbstractApiClient } from "../abstract-api.service";
import { ClothingItemApi } from "./clothes";


@Injectable({ providedIn: 'root' })
export class ClothesApiClient extends AbstractApiClient<ClothingItemApi, number> {
  protected readonly baseUrl = 'http://localhost:3000';
  protected readonly resourceName = 'clothes';
}