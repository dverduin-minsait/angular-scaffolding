export interface WeatherCurrent {
  id: number;
  location: string;
  city: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  icon: string;
  windKph: number;
}

export interface WeatherForecastDay {
  id: number;
  location: string;
  day: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
}
