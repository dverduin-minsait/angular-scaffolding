export interface TerritoryGeoJson {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface Territory {
  id: number;
  name: string;
  code: string;
  population: number;
  area_km2: number;
  capital: string;
  density: number;
  gdp_per_capita: number;
  color: string;
  bounds: [[number, number], [number, number]];
  geojson: TerritoryGeoJson;
}

export type PoiType = 'capital' | 'city';

export interface MapPoi {
  id: number;
  name: string;
  type: PoiType;
  territoryId: number;
  lat: number;
  lng: number;
  population: number;
  founded: number;
  description: string;
}
