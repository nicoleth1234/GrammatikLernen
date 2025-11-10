import { ladeCsvDatei } from "./csv-loader.js";
export const PERSONEN = ["1", "2", "3"];
export const NUMERI = ["sg", "pl"];
export function emptyFormsTable() {
    return {
        "1": { sg: "—", pl: "—" },
        "2": { sg: "—", pl: "—" },
        "3": { sg: "—", pl: "—" },
    };
}
/* ---------------- Kontraktionen (minimal) ---------------- */
/** Einfache ε-Kontraktion (ohne Akzente) – ausreichend für ποιέω */
function contractE(base, end) {
    // base endet auf -ε (z. B. ποιε)
    const stem = base.replace(/ε$/u, "");
    if (end.startsWith("ω"))
        return stem + "ω";
    if (end.startsWith("εις"))
        return stem + "εις";
    if (end.startsWith("ει"))
        return stem + "ει";
    if (end.startsWith("ο"))
        return stem + "ου" + end.slice(1); // ο.. → ου..
    if (end.startsWith("ε"))
        return stem + "ει" + end.slice(1); // ε.. → ει..
    if (end.startsWith("ου"))
        return stem + "ου" + end.slice(2);
    return stem + end;
}
function applyContraction(stem, end, kind) {
    switch (kind) {
        case "contract_e": return contractE(stem, end);
        // Hooks für später:
        // case "contract_a": ...
        // case "contract_o": ...
        default: return stem + end;
    }
}
/* ---------------- CSV-Parser (optional nützlich überall) ---------------- */
export async function loadGreekEndingsCsv(path = "assets/data/gr_verben_endungen.csv") {
    const rows = await ladeCsvDatei(path);
    const h = rows[0].map(x => x.trim().toLowerCase());
    const I = (k) => h.indexOf(k);
    return rows.slice(1).map(r => ({
        konjugation: r[I("konjugation")].trim(),
        tempus: r[I("tempus")].trim(),
        modus: r[I("modus")].trim(),
        diathese: r[I("diathese")].trim(),
        person: r[I("person")].trim(),
        numerus: r[I("numerus")].trim().toLowerCase(),
        endung: r[I("endung")].trim(),
    }));
}
export async function loadGreekVerbsCsv(path = "assets/data/gr_verben.csv") {
    const rows = await ladeCsvDatei(path);
    const h = rows[0].map(x => x.trim().toLowerCase());
    const I = (k) => h.indexOf(k);
    return rows.slice(1).map(r => {
        var _a;
        return ({
            lemma: r[I("lemma")].trim(),
            infinitiv: r[I("infinitiv")].trim(),
            stamm_praes: r[I("stamm_praes")].trim(),
            stamm_fut: r[I("stamm_fut")].trim(),
            stamm_aor: r[I("stamm_aor")].trim(),
            stamm_perf_akt: r[I("stamm_perf_akt")].trim(),
            stamm_perf_mp: r[I("stamm_perf_mp")].trim(),
            stamm_aor_pass: r[I("stamm_aor_pass")].trim(),
            konjugation: r[I("konjugation")].trim(),
            kontraktions_typ: (((_a = r[I("kontraktions_typ")]) === null || _a === void 0 ? void 0 : _a.trim()) || "none"),
            bedeutung: I("bedeutung") >= 0 ? r[I("bedeutung")].trim() : "",
        });
    });
}
/* ---------------- Formenbildung ---------------- */
export function buildGreekForms(verb, tempus, modus, diathese, endings) {
    const tbl = emptyFormsTable();
    const rel = endings.filter(e => e.konjugation === verb.konjugation &&
        e.tempus === tempus &&
        e.modus === modus &&
        e.diathese === diathese);
    // aktuell nur Präsens:
    const stem = verb.stamm_praes;
    for (const e of rel) {
        const out = verb.kontraktions_typ === "none"
            ? (stem + e.endung)
            : applyContraction(stem, e.endung, verb.kontraktions_typ);
        tbl[e.person][e.numerus] = out;
    }
    return tbl;
}
