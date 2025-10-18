// src/utils/substantive-loader.ts
import { ladeCsvDatei } from "./csv-loader.js";
let cache = null;
export async function ladeSubstantive() {
    if (cache)
        return cache;
    const csv = await ladeCsvDatei("assets/data/substantive.csv");
    if (csv.length === 0)
        return [];
    const header = csv[0];
    const i = {
        Deklination: header.indexOf("Deklination"),
        Genus: header.indexOf("Genus"),
        Stamm: header.indexOf("Stamm"),
        NomSg: header.indexOf("Nom. Sg"),
        IstIStamm: header.indexOf("ist_i_stamm"),
    };
    for (const [k, v] of Object.entries(i)) {
        if (v === -1)
            throw new Error(`CSV-Header fehlt Spalte: ${k}`);
    }
    cache = csv.slice(1).map(row => ({
        dekl: row[i.Deklination].trim(),
        genus: row[i.Genus].trim(),
        stamm: row[i.Stamm].trim(),
        nomSg: row[i.NomSg].trim(),
        istIStamm: String(row[i.IstIStamm]).trim().toLowerCase() === "true",
    }));
    return cache;
}
