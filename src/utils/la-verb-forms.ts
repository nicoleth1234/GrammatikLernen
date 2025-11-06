import type { EndungsRow, VerbRow, IrregRow, Tempus, Modus, Diathese, Person, Numerus, Konjugation } from "./la-verb-loader.js";

export type FormsTable = Record<Person, Record<Numerus, string>>; // 1..3 × Sg/Pl

export function buildEndungsIndex(rows: EndungsRow[]) {
    // key: konj|tempus|modus|diathese|person|numerus
    const key = (k: Konjugation, t: Tempus, m: Modus, d: Diathese, p: Person, n: Numerus) =>
        `${k}|${t}|${m}|${d}|${p}|${n}`;
    const map = new Map<string, string>();
    for (const r of rows) map.set(key(r.konj, r.tempus, r.modus, r.diathese, r.person, r.numerus), r.endung);
    return { get: (k: Konjugation, t: Tempus, m: Modus, d: Diathese, p: Person, n: Numerus) => map.get(key(k,t,m,d,p,n)) ?? "" };
}

export function buildIrregIndex(rows: IrregRow[]) {
    const key = (lemma: string, t: Tempus, m: Modus, d: Diathese, p: Person, n: Numerus) =>
        `${lemma}|${t}|${m}|${d}|${p}|${n}`;
    const map = new Map<string, string>();
    for (const r of rows) map.set(key(r.lemma, r.tempus, r.modus, r.diathese, r.person, r.numerus), r.form);
    return { get: (lemma: string, t: Tempus, m: Modus, d: Diathese, p: Person, n: Numerus) => map.get(key(lemma,t,m,d,p,n)) };
}

// deklinationen/src/utils/la-verb-forms.ts



const VOWELS = new Set(["a","e","i","o","u"]);

// Hilfsfunktion für den Stamm je Tempus
function stemFor(verb: VerbRow, tempus: Tempus): string {
    if (tempus === "Perfekt" || tempus === "Plusquamperfekt") {
        return verb.perfektstamm;  // z. B. amav-, monu-, rex-, cep-, audiv-
    }
    // Praesens, Imperfekt, (später: Futur I) → Präsensstamm
    return verb.praesensstamm;
}

function joinStemAndEnding(
    verb: VerbRow,
    end: string,
    tempus: Tempus,
    modus: Modus,
    diathese: Diathese,
    person: Person,
    numerus: Numerus
): string {
    let stem = verb.praesensstamm || "";
    if (!end) return stem;

    const sLast = stem.slice(-1);
    const eFirst = end.slice(0,1);

    // Regel 1: 1. Konjugation, Präsens, Indikativ, Aktiv, 1. Person Sg:
    // "…a" + "o" → "…o" (ama + o → amo; exspecta + o → exspecto)
    if (
        verb.konj === "1" &&
        tempus === "Praesens" &&
        modus === "Indikativ" &&
        diathese === "Aktiv" &&
        person === "1" &&
        numerus === "Sg" &&
        sLast === "a" &&
        end === "o"
    ) {
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
export function buildForms(
    verb: VerbRow,
    endIdx: ReturnType<typeof buildEndungsIndex>,
    irrIdx: ReturnType<typeof buildIrregIndex>,
    tempus: Tempus,
    modus: Modus,
    diathese: Diathese
): FormsTable {
    const table: FormsTable = {
        "1": { Sg: "—", Pl: "—" },
        "2": { Sg: "—", Pl: "—" },
        "3": { Sg: "—", Pl: "—" },
    };
    const persons: Person[] = modus === "Imperativ" ? ["2"] : ["1","2","3"];
    const numeri: Numerus[] = modus === "Imperativ" ? ["Sg","Pl"] : ["Sg","Pl"];

    for (const p of persons) {
        for (const n of numeri) {
            // 1) Irreg override
            const irr = irrIdx.get(verb.lemma, tempus, modus, diathese, p, n);
            if (irr) { table[p][n] = irr; continue; }

            // 2) regulär: Präsensstamm + Endung
            // const end = endIdx.get(verb.konj, tempus, modus, diathese, p, n);
            // const stem = verb.praesensstamm;
            // table[p][n] = end ? joinStemAndEnding(verb, end, tempus, modus, diathese, p, n) : "—";
            const end = endIdx.get(verb.konj, tempus, modus, diathese, p, n);
            const stem = stemFor(verb, tempus);

            if (!end) {
                table[p][n] = "—";
            } else if (tempus === "Perfekt" || tempus === "Plusquamperfekt") {
                // Perfekt-System: stumpf konkatenieren, keine a/o-Korrektur nötig
                table[p][n] = stem + end;
            } else {
                // Präsens-System (Praesens, Imperfekt): mit Join-Helper (verhindert z. B. vide+eo → video)
                table[p][n] = joinStemAndEnding(verb, end, tempus, modus, diathese, p, n);
            }
        }
    }
    return table;
}
