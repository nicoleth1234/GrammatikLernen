export function buildEndungsIndex(rows) {
    // key: konj|tempus|modus|diathese|person|numerus
    const key = (k, t, m, d, p, n) => `${k}|${t}|${m}|${d}|${p}|${n}`;
    const map = new Map();
    for (const r of rows)
        map.set(key(r.konj, r.tempus, r.modus, r.diathese, r.person, r.numerus), r.endung);
    return { get: (k, t, m, d, p, n) => { var _a; return (_a = map.get(key(k, t, m, d, p, n))) !== null && _a !== void 0 ? _a : ""; } };
}
export function buildIrregIndex(rows) {
    const key = (lemma, t, m, d, p, n) => `${lemma}|${t}|${m}|${d}|${p}|${n}`;
    const map = new Map();
    for (const r of rows)
        map.set(key(r.lemma, r.tempus, r.modus, r.diathese, r.person, r.numerus), r.form);
    return { get: (lemma, t, m, d, p, n) => map.get(key(lemma, t, m, d, p, n)) };
}
// deklinationen/src/utils/la-verb-forms.ts
const VOWELS = new Set(["a", "e", "i", "o", "u"]);
// Hilfsfunktion für den Stamm je Tempus
function stemFor(verb, tempus) {
    if (tempus === "Perfekt" || tempus === "Plusquamperfekt") {
        return verb.perfektstamm; // z. B. amav-, monu-, rex-, cep-, audiv-
    }
    // Praesens, Imperfekt, (später: Futur I) → Präsensstamm
    return verb.praesensstamm;
}
function joinStemAndEnding(verb, end, tempus, modus, diathese, person, numerus) {
    let stem = verb.praesensstamm || "";
    if (!end)
        return stem;
    const sLast = stem.slice(-1);
    const eFirst = end.slice(0, 1);
    // Regel 1: 1. Konjugation, Präsens, Indikativ, Aktiv, 1. Person Sg:
    // "…a" + "o" → "…o" (ama + o → amo; exspecta + o → exspecto)
    if (verb.konj === "1" &&
        tempus === "Praesens" &&
        modus === "Indikativ" &&
        diathese === "Aktiv" &&
        person === "1" &&
        numerus === "Sg" &&
        sLast === "a" &&
        end === "o") {
        return stem.slice(0, -1) + "o";
    }
    // Regel 2: Allgemeine Doppelvokal-Glättung:
    // Wenn Stamm auf Vokal endet und Endung mit demselben Vokal beginnt, den
    // ersten Vokal der Endung entfernen (exspecta + as → exspectas; vide + eo → video)
    if (sLast && eFirst && sLast === eFirst && VOWELS.has(sLast)) {
        end = end.slice(1);
    }
    return stem + end;
}
/** Baut 6-Feld-Tabelle (Indikativ) oder 2-Feld-Tabelle (Imperativ: nur 2. Person Sg/Pl) */
export function buildForms(verb, endIdx, irrIdx, tempus, modus, diathese) {
    const table = {
        "1": { Sg: "—", Pl: "—" },
        "2": { Sg: "—", Pl: "—" },
        "3": { Sg: "—", Pl: "—" },
    };
    const persons = modus === "Imperativ" ? ["2"] : ["1", "2", "3"];
    const numeri = modus === "Imperativ" ? ["Sg", "Pl"] : ["Sg", "Pl"];
    for (const p of persons) {
        for (const n of numeri) {
            // 1) Irreg override
            const irr = irrIdx.get(verb.lemma, tempus, modus, diathese, p, n);
            if (irr) {
                table[p][n] = irr;
                continue;
            }
            // 2) regulär: Präsensstamm + Endung
            // const end = endIdx.get(verb.konj, tempus, modus, diathese, p, n);
            // const stem = verb.praesensstamm;
            // table[p][n] = end ? joinStemAndEnding(verb, end, tempus, modus, diathese, p, n) : "—";
            const end = endIdx.get(verb.konj, tempus, modus, diathese, p, n);
            const stem = stemFor(verb, tempus);
            if (!end) {
                table[p][n] = "—";
            }
            else if (tempus === "Perfekt" || tempus === "Plusquamperfekt") {
                // Perfekt-System: stumpf konkatenieren, keine a/o-Korrektur nötig
                table[p][n] = stem + end;
            }
            else {
                // Präsens-System (Praesens, Imperfekt): mit Join-Helper (verhindert z. B. vide+eo → video)
                table[p][n] = joinStemAndEnding(verb, end, tempus, modus, diathese, p, n);
            }
        }
    }
    return table;
}
