// src/utils/gr-endungen-index.ts
import { Kasus, Numerus } from "../models/models.js";

export type GrEndRow = {
    deklination: string; // "a" | "o" ...
    typ: string;         // "1" | "2" | "3a" | "3b" | "-" ...
    genus: "f" | "m" | "n";
    kasus: Kasus;        // "Nom."|"Gen."|"Dat."|"Akk."|"Abl."|"Vok."
    numerus: Numerus;    // "Sg"|"Pl"
    endung: string;
};

export type GrEndTbl = Record<Kasus, Record<Numerus, string>>;

export type GrKey = `${string}|${string}|${string}`; // dekl|typ|genus

export const KASUS_DE_ORDER: Kasus[] = ["Nom.", "Gen.", "Dat.", "Akk.", "Vok."] as Kasus[];

export function keyOfGr(dekl: string, typ: string, genus: string): GrKey {
    return `${dekl}|${typ}|${genus}` as GrKey;
}

export function buildGrEndungenIndex(rows: GrEndRow[]): Map<GrKey, GrEndTbl> {
    const map = new Map<GrKey, GrEndTbl>();

    // init
    for (const r of rows) {
        const k = keyOfGr(r.deklination, r.typ, r.genus);
        if (!map.has(k)) {
            const tbl = {} as GrEndTbl;
            for (const ks of KASUS_DE_ORDER) {
                tbl[ks] = { Sg: "—", Pl: "—" } as Record<Numerus, string>;
            }
            map.set(k, tbl);
        }
    }
    // fill
    for (const r of rows) {
        const k = keyOfGr(r.deklination, r.typ, r.genus);
        const tbl = map.get(k)!;
        tbl[r.kasus][r.numerus] = r.endung;
    }

    return map;
}
