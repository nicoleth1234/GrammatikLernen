// src/quizGreekNouns.ts
import { GR_ARTICLES } from "./constants/gr-articles.js";
import { buildGrEndungenIndex, KASUS_DE_ORDER, type GrEndRow } from "./utils/gr-endungen-index.js";
import { ladeGrSubstantive, type GrSubstantiv } from "./utils/gr-substantive-loader.js";
import { ladeCsvDatei } from "./utils/csv-loader.js";
import { Kasus, Numerus, Genus } from "./models/models.js";

// -------- helpers
const qs = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const qsa = <T extends HTMLElement = HTMLElement>(sel: string) => Array.from(document.querySelectorAll(sel)) as T[];

function getMode(): "normal" | "hard" {
    const m = new URLSearchParams(location.search).get("mode");
    return m === "hard" ? "hard" : "normal";
}
const MODE = getMode();
qs("#modeLabel").textContent = MODE === "normal" ? "Modus: Normal (mit Artikel, mit Hinweis)" : "Modus: Hard (ohne Artikel, ohne Hinweis)";

// -------- load Greek endings
async function ladeGrEndungenRows(): Promise<GrEndRow[]> {
    const csv = await ladeCsvDatei("assets/data/gr_deklinationen.csv");
    const header = csv[0];
    const idx = {
        Deklination: header.indexOf("Deklination"),
        Typ: header.indexOf("Typ"),
        Kasus: header.indexOf("Kasus"),
        Genus: header.indexOf("Genus"),
        Numerus: header.indexOf("Numerus"),
        Endung: header.indexOf("Endung"),
    };
    return csv.slice(1).map(r => ({
        deklination: r[idx.Deklination].trim(),
        typ: r[idx.Typ].trim(),
        genus: r[idx.Genus].trim() as "m"|"f"|"n",
        kasus: r[idx.Kasus].trim() as Kasus,
        numerus: r[idx.Numerus].trim() as Numerus,
        endung: r[idx.Endung].trim(),
    }));
}

// -------- build forms (Kasus×Numerus -> string)
function bildeFormen(stamm: string, tbl: Record<Kasus, Record<Numerus,string>>) {
    const f: Record<Kasus, Record<Numerus,string>> = {} as any;
    for (const k of KASUS_DE_ORDER) {
        f[k] = { Sg: "—", Pl: "—" };
        for (const n of [Numerus.Sg, Numerus.Pl] as const) {
            const end = tbl[k][n];
            f[k][n] = end && end !== "—" ? stamm + end : "—";
        }
    }
    return f;
}

function mitArtikel(formen: Record<Kasus, Record<Numerus,string>>, genus: "m"|"f"|"n") {
    const art = GR_ARTICLES[genus];
    const out: Record<Kasus, Record<Numerus,string>> = {} as any;
    for (const k of KASUS_DE_ORDER) {
        out[k] = { Sg: "—", Pl: "—" };
        for (const n of [Numerus.Sg, Numerus.Pl] as const) {
            const w = formen[k][n];
            if (w === "—") {
                out[k][n] = "—";
            } else if (k === Kasus.Vok) {
                // kein Artikel im Vokativ
                out[k][n] = w;
            } else {
                out[k][n] = `${art[k][n]} ${w}`;
            }
        }
    }
    return out;
}

// -------- pick utils
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// -------- state
type Aufgabe = {
    sub: GrSubstantiv;
    kasus: Kasus[];
    numerus: Numerus;
    surface: string; // angezeigter Text (mit/ohne Artikel)
};
let endIdx: ReturnType<typeof buildGrEndungenIndex>;
let subs: GrSubstantiv[] = [];
let current: Aufgabe | null = null;

// Mehrfachauswahl UI
function selectedKasus(): Kasus[] {
    return qsa<HTMLButtonElement>(".chip.sel").map(b => b.dataset.k as Kasus);
}
function resetSelection() {
    qsa<HTMLButtonElement>(".chip.sel").forEach(b => b.classList.remove("sel"));
}

function buildAufgabe(): Aufgabe {
    const s = pick(subs);
    const key = `${s.deklination}|${s.typ}|${s.genus}`;
    const tbl = endIdx.get(key as any);
    if (!tbl) return buildAufgabe(); // falls kein Endungsset (sollte nicht vorkommen)

    const f = bildeFormen(s.stamm, tbl);
    const fView = MODE === "normal" ? mitArtikel(f, s.genus) : f;
    const n = pick([Numerus.Sg, Numerus.Pl] as const);
    const k = pick(KASUS_DE_ORDER); // inkl. Vok.
    const surface = fView[k][n];

    // alle korrekten Kasus für diese Oberfläche (Synkretismen)
    const correct: Kasus[] = [];
    for (const k2 of KASUS_DE_ORDER) {
        if (fView[k2][n] === surface) correct.push(k2);
    }
    return { sub: s, kasus: correct, numerus: n, surface };
}

function renderAufgabe() {
    current = buildAufgabe();
    qs<HTMLSpanElement>("#word").textContent = current.surface;
    qs<HTMLDivElement>("#hint").textContent = "";
    qs<HTMLDivElement>("#feedback").textContent = "";
    qs<HTMLDivElement>("#feedback").className = "row";
    resetSelection();
    // meta (nur Normal)
    const m = qs<HTMLDivElement>("#meta");
    if (MODE === "normal") {
        m.textContent = "Tipp: Es kann mehrere richtige Kasus geben.";
    } else {
        m.textContent = "";
    }
    // hint button anzeigen/ausblenden
    (qs<HTMLButtonElement>("#btn-hint")).style.display = MODE === "normal" ? "inline-block" : "none";
}

// -------- events
qsa<HTMLButtonElement>(".chip").forEach(btn => {
    btn.addEventListener("click", () => btn.classList.toggle("sel"));
});

qs<HTMLButtonElement>("#btn-check").addEventListener("click", () => {
    if (!current) return;
    const chosen = selectedKasus();
    if (chosen.length === 0) {
        qs<HTMLDivElement>("#feedback").textContent = "Bitte wähle mindestens einen Kasus.";
        qs<HTMLDivElement>("#feedback").className = "row err";
        return;
    }
    // Vergleich als Sets
    const ok = chosen.length === current.kasus.length && chosen.every(k => current!.kasus.includes(k));
    if (ok) {
        qs<HTMLDivElement>("#feedback").textContent = "Richtig! ✅";
        qs<HTMLDivElement>("#feedback").className = "row ok";
        setTimeout(renderAufgabe, 700);
    } else {
        qs<HTMLDivElement>("#feedback").textContent = `Leider nein. Richtige Kasus: ${current.kasus.join(", ")}`;
        qs<HTMLDivElement>("#feedback").className = "row err";
    }
});

qs<HTMLButtonElement>("#btn-hint").addEventListener("click", () => {
    if (!current) return;
    const s = current.sub;
    const deklTxt = s.deklination === "a" ? `a-Deklination Typ ${s.typ}` : `o-Deklination`;
    const gTxt = s.genus === "m" ? "m" : s.genus === "f" ? "f" : "n";
    const nTxt = current.numerus;
    qs<HTMLDivElement>("#hint").textContent = `${deklTxt}, ${gTxt}, ${nTxt}`;
});

qs<HTMLButtonElement>("#btn-next").addEventListener("click", renderAufgabe);

// -------- init
(async function start() {
    const [rows, sList] = await Promise.all([ladeGrEndungenRows(), ladeGrSubstantive()]);
    endIdx = buildGrEndungenIndex(rows);
    // nur Substantive, für die es Endungen gibt
    subs = sList.filter(s => endIdx.has(`${s.deklination}|${s.typ}|${s.genus}` as any));
    renderAufgabe();
})();
