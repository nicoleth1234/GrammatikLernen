import { Kasus, Numerus } from "../models/models.js";
export const KASUS_ORDER = [Kasus.Nom, Kasus.Gen, Kasus.Dat, Kasus.Akk, Kasus.Abl, Kasus.Vok];
export function keyOf(dekl, genus) {
    return `${dekl}|${genus}`;
}
export function buildEndungenIndex(rows) {
    const map = new Map();
    // alle Kombinationen initialisieren
    for (const r of rows) {
        const k = keyOf(r.deklination, r.genus);
        if (!map.has(k)) {
            const tbl = {};
            for (const kasus of KASUS_ORDER) {
                tbl[kasus] = { [Numerus.Sg]: "—", [Numerus.Pl]: "—" };
            }
            map.set(k, tbl);
        }
    }
    // füllen
    for (const r of rows) {
        const k = keyOf(r.deklination, r.genus);
        const tbl = map.get(k);
        tbl[r.kasus][r.numerus] = r.endung;
    }
    return map;
}
