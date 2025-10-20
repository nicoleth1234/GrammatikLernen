export const KASUS_DE_ORDER = ["Nom.", "Gen.", "Dat.", "Akk.", "Vok."];
export function keyOfGr(dekl, typ, genus) {
    return `${dekl}|${typ}|${genus}`;
}
export function buildGrEndungenIndex(rows) {
    const map = new Map();
    // init
    for (const r of rows) {
        const k = keyOfGr(r.deklination, r.typ, r.genus);
        if (!map.has(k)) {
            const tbl = {};
            for (const ks of KASUS_DE_ORDER) {
                tbl[ks] = { Sg: "—", Pl: "—" };
            }
            map.set(k, tbl);
        }
    }
    // fill
    for (const r of rows) {
        const k = keyOfGr(r.deklination, r.typ, r.genus);
        const tbl = map.get(k);
        tbl[r.kasus][r.numerus] = r.endung;
    }
    return map;
}
