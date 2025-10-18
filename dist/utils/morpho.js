// src/utils/morpho.ts
import { Deklinationen, Genus, Kasus, Numerus } from "../models/models.js";
export const KASUS_ORDER = [Kasus.Nom, Kasus.Gen, Kasus.Dat, Kasus.Akk, Kasus.Abl, Kasus.Vok];
function cloneTbl(src) {
    // tiefer Clone
    return JSON.parse(JSON.stringify(src));
}
/** erzeugt alle Formen (Sg/Pl × 6 Kasus) mithilfe dynamischer Endungen aus dem CSV-Index */
export function bildeFormenDyn(s, endIdx) {
    const key = `${s.dekl}|${s.genus}`;
    const ends = endIdx.get(key);
    if (!ends)
        throw new Error(`Keine Endungen gefunden für ${key}`);
    const tbl = cloneTbl(ends);
    // Helper um alles auf Stamm+Endung zu setzen
    const fillStemPlusEnd = (skip = []) => {
        const skipSet = new Set(skip.map(([k, n]) => `${k}|${n}`));
        for (const k of KASUS_ORDER) {
            for (const n of [Numerus.Sg, Numerus.Pl]) {
                if (skipSet.has(`${k}|${n}`))
                    continue;
                tbl[k][n] = s.stamm + ends[k][n];
            }
        }
    };
    // Regeln nach Deklination/Genus
    if (s.dekl === Deklinationen.A && s.genus === Genus.F) {
        // rein Stamm + Endung
        fillStemPlusEnd();
        return tbl;
    }
    if (s.dekl === Deklinationen.O && s.genus === Genus.M) {
        // Nom/Vok Sg aus Lemma-Logik (us/e, ius/ī, er/er)
        const nomSgLemma = s.nomSg;
        const isIus = nomSgLemma.endsWith("ius");
        const isEr = nomSgLemma.endsWith("er");
        // Nom Sg nach Lemma
        tbl[Kasus.Nom][Numerus.Sg] = nomSgLemma;
        // Vok Sg nach Regel
        if (isIus)
            tbl[Kasus.Vok][Numerus.Sg] = s.stamm + "ī";
        else if (isEr)
            tbl[Kasus.Vok][Numerus.Sg] = nomSgLemma; // = Nom
        else
            tbl[Kasus.Vok][Numerus.Sg] = s.stamm + "e";
        // Rest = Stamm + CSV-Endung
        fillStemPlusEnd([
            [Kasus.Nom, Numerus.Sg],
            [Kasus.Vok, Numerus.Sg],
        ]);
        return tbl;
    }
    if (s.dekl === Deklinationen.O && s.genus === Genus.N) {
        fillStemPlusEnd();
        return tbl;
    }
    if (s.dekl === Deklinationen.Dritte && s.genus === Genus.M) {
        // Nom/Vok Sg = Lemma; Rest Stamm + Endung
        tbl[Kasus.Nom][Numerus.Sg] = s.nomSg;
        tbl[Kasus.Vok][Numerus.Sg] = s.nomSg;
        fillStemPlusEnd([
            [Kasus.Nom, Numerus.Sg],
            [Kasus.Vok, Numerus.Sg],
        ]);
        return tbl;
    }
    if (s.dekl === Deklinationen.Dritte && s.genus === Genus.N) {
        // Neutrum: Nom/Akk/Vok Sg = Lemma
        tbl[Kasus.Nom][Numerus.Sg] = s.nomSg;
        tbl[Kasus.Akk][Numerus.Sg] = s.nomSg;
        tbl[Kasus.Vok][Numerus.Sg] = s.nomSg;
        fillStemPlusEnd([
            [Kasus.Nom, Numerus.Sg],
            [Kasus.Akk, Numerus.Sg],
            [Kasus.Vok, Numerus.Sg],
        ]);
        return tbl;
    }
    throw new Error(`Nicht unterstützt: ${s.dekl}/${s.genus}`);
}
