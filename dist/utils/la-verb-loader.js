import { ladeCsvDatei } from "./csv-loader.js";
// Kleine Lookup für Anzeigezwecke
const IRREG_INFINITIV = {
    "sum": "esse",
    "possum": "posse",
    "volo": "velle",
    "nolo": "nolle",
    "malo": "malle",
    "fero": "ferre",
    "eo": "ire",
};
// Aus den Irreg-Zeilen VerbRow-Einträge erzeugen
export async function ladeIrregAlsVerben() {
    var _a;
    const irregs = await ladeIrreg();
    const lemmas = new Set();
    for (const r of irregs)
        lemmas.add(r.lemma);
    const rows = [];
    for (const lemma of lemmas) {
        rows.push({
            lemma,
            infinitiv: (_a = IRREG_INFINITIV[lemma]) !== null && _a !== void 0 ? _a : "", // wenn bekannt anzeigen
            konj: "irr",
            praesensstamm: "", // ungenutzt bei irr.
            perfektstamm: "", // ungenutzt bei irr.
            supinstamm: "", // ungenutzt bei irr.
            deponens: false,
        });
    }
    return rows;
}
export async function ladeEndungen() {
    const rows = await ladeCsvDatei("assets/data/la_verb_endungen.csv");
    const h = rows[0];
    const I = (k) => h.indexOf(k);
    return rows.slice(1).map(r => ({
        konj: r[I("Konjugation")].trim(),
        tempus: r[I("Tempus")].trim(),
        modus: r[I("Modus")].trim(),
        diathese: r[I("Diathese")].trim(),
        person: r[I("Person")].trim(),
        numerus: r[I("Numerus")].trim(),
        endung: r[I("Endung")].trim(),
    }));
}
export async function ladeVerben() {
    const rows = await ladeCsvDatei("assets/data/la_verben.csv");
    const h = rows[0];
    const I = (k) => h.indexOf(k);
    return rows.slice(1).map(r => {
        var _a, _b;
        return ({
            lemma: r[I("Lemma")].trim(),
            infinitiv: (_b = (_a = r[I("Infinitiv")]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "", // NEU
            konj: r[I("Konjugation")].trim(),
            praesensstamm: r[I("Praesensstamm")].trim(),
            perfektstamm: r[I("Perfektstamm")].trim(),
            supinstamm: r[I("Supinstamm")].trim(),
            deponens: (r[I("Deponens")].trim().toLowerCase() === "true"),
        });
    });
}
export async function ladeIrreg() {
    const rows = await ladeCsvDatei("assets/data/la_verben_irreg.csv");
    if (!rows.length)
        return [];
    const h = rows[0];
    const I = (k) => h.indexOf(k);
    return rows.slice(1).map(r => ({
        lemma: r[I("Lemma")].trim(),
        tempus: r[I("Tempus")].trim(),
        modus: r[I("Modus")].trim(),
        diathese: r[I("Diathese")].trim(),
        person: r[I("Person")].trim(),
        numerus: r[I("Numerus")].trim(),
        form: r[I("Form")].trim(),
    }));
}
