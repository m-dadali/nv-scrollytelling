import type {DSVParsedArray} from "d3";
import * as d3 from "d3";
import type {DataRow} from "./types.ts";

export const importedData: DSVParsedArray<DataRow> = await d3.csv("data/data.csv", row => ({
    entity: row.Entity,
    code: row.Code,
    year: Number(row.Year),
    directHumanFood: row["Direct human food (tofu, soy milk, tempeh etc.)"] ? Number(row["Direct human food (tofu, soy milk, tempeh etc.)"]) : 0,
    directAnimalFeed: row["Direct animal feed"] ? Number(row["Direct animal feed"]) : 0,
    processed: row["Processed (processed animal feed; biofuels; vegetable oil)"] ? Number(row["Processed (processed animal feed; biofuels; vegetable oil)"]) : 0
}));