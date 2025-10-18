// src/utils/endungen-index.ts
import { Deklination } from "../models/models.js";
import { Kasus, Numerus } from "../models/models.js";

export type EndungenTbl = Record<Kasus, Record<Numerus, string>>;
export const KASUS_ORDER: Kasus[] = [Kasus.Nom, Kasus.Gen, Kasus.Dat, Kasus.Akk, Kasus.Abl, Kasus.Vok];

// Key-Typ: "a|f", "o|m", "3|n" usw.
export type EndKey = `${string}|${string}`;

export function keyOf(dekl: string, genus: string): EndKey {
    return `${dekl}|${genus}` as EndKey;
}

export function buildEndungenIndex(rows: Deklination[]): Map<EndKey, EndungenTbl> {
    const map = new Map<EndKey, EndungenTbl>();

    // alle Kombinationen initialisieren
    for (const r of rows) {
        const k = keyOf(r.deklination, r.genus);
        if (!map.has(k)) {
            const tbl = {} as EndungenTbl;
            for (const kasus of KASUS_ORDER) {
                tbl[kasus] = { [Numerus.Sg]: "—", [Numerus.Pl]: "—" } as Record<Numerus, string>;
            }
            map.set(k, tbl);
        }
    }

    // füllen
    for (const r of rows) {
        const k = keyOf(r.deklination, r.genus);
        const tbl = map.get(k)!;
        tbl[r.kasus][r.numerus] = r.endung;
    }

    return map;
}
