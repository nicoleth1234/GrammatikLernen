import { ladeCsvDatei } from "./csv-loader.js";

/** Grundtypen */
export type Person = "1" | "2" | "3";
export type Numerus = "sg" | "pl";
export type Diathese = "aktiv" | "medium" | "passiv";
export type Modus = "indikativ" | "imperativ" | "konjunktiv" | "optativ";
export type Tempus = "praesens"; // vorerst nur Präsens, später erweiterbar
export type Konjugation = "omega";

export const PERSONEN: ReadonlyArray<Person> = ["1", "2", "3"] as const;
export const NUMERI: ReadonlyArray<Numerus> = ["sg", "pl"] as const;

/** Endungs-Datensatz (aus CSV gr_verben_endungen.csv) */
export type EndingRow = {
    konjugation: Konjugation;
    tempus: Tempus;
    modus: Modus;
    diathese: Diathese;
    person: Person;
    numerus: Numerus;
    endung: string;
};

/** Verb-Datensatz (aus CSV gr_verben.csv) */
export type GrVerb = {
    lemma: string;
    infinitiv: string;
    stamm_praes: string;
    stamm_fut: string;
    stamm_aor: string;
    stamm_perf_akt: string;
    stamm_perf_mp: string;
    stamm_aor_pass: string;
    konjugation: Konjugation;
    kontraktions_typ: "none" | "contract_e" | "contract_a" | "contract_o";
    bedeutung?: string;
};

export type FormsTable = Record<Person, Record<Numerus, string>>;

export function emptyFormsTable(): FormsTable {
    return {
        "1": { sg: "—", pl: "—" },
        "2": { sg: "—", pl: "—" },
        "3": { sg: "—", pl: "—" },
    };
}

/* ---------------- Kontraktionen (minimal) ---------------- */

/** Einfache ε-Kontraktion (ohne Akzente) – ausreichend für ποιέω */
function contractE(base: string, end: string): string {
    // base endet auf -ε (z. B. ποιε)
    const stem = base.replace(/ε$/u, "");
    if (end.startsWith("ω")) return stem + "ω";
    if (end.startsWith("εις")) return stem + "εις";
    if (end.startsWith("ει")) return stem + "ει";
    if (end.startsWith("ο")) return stem + "ου" + end.slice(1); // ο.. → ου..
    if (end.startsWith("ε")) return stem + "ει" + end.slice(1); // ε.. → ει..
    if (end.startsWith("ου")) return stem + "ου" + end.slice(2);
    return stem + end;
}

function applyContraction(stem: string, end: string, kind: GrVerb["kontraktions_typ"]): string {
    switch (kind) {
        case "contract_e": return contractE(stem, end);
        // Hooks für später:
        // case "contract_a": ...
        // case "contract_o": ...
        default: return stem + end;
    }
}

/* ---------------- CSV-Parser (optional nützlich überall) ---------------- */

export async function loadGreekEndingsCsv(path = "assets/data/gr_verben_endungen.csv"): Promise<EndingRow[]> {
    const rows = await ladeCsvDatei(path);
    const h = rows[0].map(x => x.trim().toLowerCase());
    const I = (k: string) => h.indexOf(k);
    return rows.slice(1).map(r => ({
        konjugation: r[I("konjugation")].trim() as Konjugation,
        tempus: r[I("tempus")].trim() as Tempus,
        modus: r[I("modus")].trim() as Modus,
        diathese: r[I("diathese")].trim() as Diathese,
        person: r[I("person")].trim() as Person,
        numerus: r[I("numerus")].trim().toLowerCase() as Numerus,
        endung: r[I("endung")].trim(),
    }));
}

export async function loadGreekVerbsCsv(path = "assets/data/gr_verben.csv"): Promise<GrVerb[]> {
    const rows = await ladeCsvDatei(path);
    const h = rows[0].map(x => x.trim().toLowerCase());
    const I = (k: string) => h.indexOf(k);
    return rows.slice(1).map(r => ({
        lemma: r[I("lemma")].trim(),
        infinitiv: r[I("infinitiv")].trim(),
        stamm_praes: r[I("stamm_praes")].trim(),
        stamm_fut: r[I("stamm_fut")].trim(),
        stamm_aor: r[I("stamm_aor")].trim(),
        stamm_perf_akt: r[I("stamm_perf_akt")].trim(),
        stamm_perf_mp: r[I("stamm_perf_mp")].trim(),
        stamm_aor_pass: r[I("stamm_aor_pass")].trim(),
        konjugation: r[I("konjugation")].trim() as Konjugation,
        kontraktions_typ: (r[I("kontraktions_typ")]?.trim() || "none") as GrVerb["kontraktions_typ"],
        bedeutung: I("bedeutung") >= 0 ? r[I("bedeutung")].trim() : "",
    }));
}

/* ---------------- Formenbildung ---------------- */

export function buildGreekForms(
    verb: GrVerb,
    tempus: Tempus,
    modus: Modus,
    diathese: Diathese,
    endings: ReadonlyArray<EndingRow>
): FormsTable {
    const tbl = emptyFormsTable();
    const rel = endings.filter(e =>
        e.konjugation === verb.konjugation &&
        e.tempus === tempus &&
        e.modus === modus &&
        e.diathese === diathese
    );

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
