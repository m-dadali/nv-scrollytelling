export type DataRow = {
    entity: string;
    code: string;
    year: number;
    directHumanFood: number;
    directAnimalFeed: number;
    processed: number;
};

export type CountrySummary = DataRow & {
    total: number;
    processedShare: number;
};

export type ChartSeriesKey = "human" | "animal" | "processed";
export type StackedSeries = { key: ChartSeriesKey; values: Array<{ year: number; value: number }> };

export type ComparisonValue = {
    key: ChartSeriesKey;
    label: string;
    value: number;
    pct: number;
};