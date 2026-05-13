export interface ElectricalReading {
  id: number;
  location: string;
  hour: string;
  kwh: number;
  costEur: number;
}

export interface ElectricalSummary {
  id: number;
  location: string;
  todayKwh: number;
  todayCostEur: number;
  monthKwh: number;
  monthCostEur: number;
  peakHour: string;
  avgDailyKwh: number;
}
