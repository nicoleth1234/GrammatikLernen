import { ladeCsvDatei } from "./csv-loader.js";

export type Konjugation = "1" | "2" | "3" | "3i" | "4" | "irr";
export type Tempus = "Praesens" | "Imperfekt" | "Perfekt" | "Plusquamperfekt"; // später erweiterbar
export type Modus = "Indikativ" | "Imperativ";
export type Diathese = "Aktiv" | "Passiv";
export type Person = "1" | "2" | "3";
export type Numerus = "Sg" | "Pl";

export type EndungsRow = {
    konj: Konjugation;
    tempus: Tempus;
    modus: Modus;
    diathese: Diathese;
    person: Person;
    numerus: Numerus;
    endung: string;
};

export type VerbRow = {
    lemma: string;
    infinitiv: string;              // NEU
    konj: Konjugation;
    praesensstamm: string;
    perfektstamm: string;
    supinstamm: string;
    deponens: boolean;
};

export type IrregRow = {
    lemma: string;
    tempus: Tempus;
    modus: Modus;
    diathese: Diathese;
    person: Person;
    numerus: Numerus;
    form: string;
};

// Kleine Lookup für Anzeigezwecke
const IRREG_INFINITIV: Record<string, string> = {
    "sum": "esse",
    "possum": "posse",
    "volo": "velle",
    "nolo": "nolle",
    "malo": "malle",
    "fero": "ferre",
    "eo": "ire",
};

// Aus den Irreg-Zeilen VerbRow-Einträge erzeugen
export async function ladeIrregAlsVerben(): Promise<VerbRow[]> {
    const irregs = await ladeIrreg();
    const lemmas = new Set<string>();
    for (const r of irregs) lemmas.add(r.lemma);

    const rows: VerbRow[] = [];
    for (const lemma of lemmas) {
        rows.push({
            lemma,
            infinitiv: IRREG_INFINITIV[lemma] ?? "", // wenn bekannt anzeigen
            konj: "irr",
            praesensstamm: "",   // ungenutzt bei irr.
            perfektstamm: "",    // ungenutzt bei irr.
            supinstamm: "",      // ungenutzt bei irr.
            deponens: false,
        });
    }
    return rows;
}


export async function ladeEndungen(): Promise<EndungsRow[]> {
    const rows = await ladeCsvDatei("assets/data/la_verb_endungen.csv");
    const h = rows[0];
    const I = (k: string) => h.indexOf(k);
    return rows.slice(1).map(r => ({
        konj: r[I("Konjugation")].trim() as Konjugation,
        tempus: r[I("Tempus")].trim() as Tempus,
        modus: r[I("Modus")].trim() as Modus,
        diathese: r[I("Diathese")].trim() as Diathese,
        person: r[I("Person")].trim() as Person,
        numerus: r[I("Numerus")].trim() as Numerus,
        endung: r[I("Endung")].trim(),
    }));
}

export async function ladeVerben(): Promise<VerbRow[]> {
    const rows = await ladeCsvDatei("assets/data/la_verben.csv");
    const h = rows[0];
    const I = (k: string) => h.indexOf(k);
    return rows.slice(1).map(r => ({
        lemma: r[I("Lemma")].trim(),
        infinitiv: r[I("Infinitiv")]?.trim() ?? "",     // NEU
        konj: r[I("Konjugation")].trim() as Konjugation,
        praesensstamm: r[I("Praesensstamm")].trim(),
        perfektstamm: r[I("Perfektstamm")].trim(),
        supinstamm: r[I("Supinstamm")].trim(),
        deponens: (r[I("Deponens")].trim().toLowerCase() === "true"),
    }));
}

export async function ladeIrreg(): Promise<IrregRow[]> {
    const rows = await ladeCsvDatei("assets/data/la_verben_irreg.csv");
    if (!rows.length) return [];
    const h = rows[0];
    const I = (k: string) => h.indexOf(k);
    return rows.slice(1).map(r => ({
        lemma: r[I("Lemma")].trim(),
        tempus: r[I("Tempus")].trim() as Tempus,
        modus: r[I("Modus")].trim() as Modus,
        diathese: r[I("Diathese")].trim() as Diathese,
        person: r[I("Person")].trim() as Person,
        numerus: r[I("Numerus")].trim() as Numerus,
        form: r[I("Form")].trim(),
    }));
}
