// src/quizGreekNouns.ts
import { GR_ARTICLES } from "./constants/gr-articles.js";
import { buildGrEndungenIndex, KASUS_DE_ORDER } from "./utils/gr-endungen-index.js";
import { ladeGrSubstantive } from "./utils/gr-substantive-loader.js";
import { ladeCsvDatei } from "./utils/csv-loader.js";
import { Kasus, Numerus } from "./models/models.js";
// -------- helpers
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));
function getMode() {
    const m = new URLSearchParams(location.search).get("mode");
    return m === "hard" ? "hard" : "normal";
}
const MODE = getMode();
qs("#modeLabel").textContent = MODE === "normal" ? "Modus: Normal (mit Artikel, mit Hinweis)" : "Modus: Hard (ohne Artikel, ohne Hinweis)";
// -------- load Greek endings
async function ladeGrEndungenRows() {
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
        genus: r[idx.Genus].trim(),
        kasus: r[idx.Kasus].trim(),
        numerus: r[idx.Numerus].trim(),
        endung: r[idx.Endung].trim(),
    }));
}
// -------- build forms (Kasus×Numerus -> string)
function bildeFormen(stamm, tbl) {
    const f = {};
    for (const k of KASUS_DE_ORDER) {
        f[k] = { Sg: "—", Pl: "—" };
        for (const n of [Numerus.Sg, Numerus.Pl]) {
            const end = tbl[k][n];
            f[k][n] = end && end !== "—" ? stamm + end : "—";
        }
    }
    return f;
}
function mitArtikel(formen, genus) {
    const art = GR_ARTICLES[genus];
    const out = {};
    for (const k of KASUS_DE_ORDER) {
        out[k] = { Sg: "—", Pl: "—" };
        for (const n of [Numerus.Sg, Numerus.Pl]) {
            const w = formen[k][n];
            if (w === "—") {
                out[k][n] = "—";
            }
            else if (k === Kasus.Vok) {
                // kein Artikel im Vokativ
                out[k][n] = w;
            }
            else {
                out[k][n] = `${art[k][n]} ${w}`;
            }
        }
    }
    return out;
}
// -------- pick utils
const pick = (a) => a[Math.floor(Math.random() * a.length)];
let endIdx;
let subs = [];
let current = null;
// Mehrfachauswahl UI
function selectedKasus() {
    return qsa(".chip.sel").map(b => b.dataset.k);
}
function resetSelection() {
    qsa(".chip.sel").forEach(b => b.classList.remove("sel"));
}
function buildAufgabe() {
    const s = pick(subs);
    const key = `${s.deklination}|${s.typ}|${s.genus}`;
    const tbl = endIdx.get(key);
    if (!tbl)
        return buildAufgabe(); // falls kein Endungsset (sollte nicht vorkommen)
    const f = bildeFormen(s.stamm, tbl);
    const fView = MODE === "normal" ? mitArtikel(f, s.genus) : f;
    const n = pick([Numerus.Sg, Numerus.Pl]);
    const k = pick(KASUS_DE_ORDER); // inkl. Vok.
    const surface = fView[k][n];
    // alle korrekten Kasus für diese Oberfläche (Synkretismen)
    const correct = [];
    for (const k2 of KASUS_DE_ORDER) {
        if (fView[k2][n] === surface)
            correct.push(k2);
    }
    return { sub: s, kasus: correct, numerus: n, surface };
}
function renderAufgabe() {
    current = buildAufgabe();
    qs("#word").textContent = current.surface;
    qs("#hint").textContent = "";
    qs("#feedback").textContent = "";
    qs("#feedback").className = "row";
    resetSelection();
    // meta (nur Normal)
    const m = qs("#meta");
    if (MODE === "normal") {
        m.textContent = "Tipp: Es kann mehrere richtige Kasus geben.";
    }
    else {
        m.textContent = "";
    }
    // hint button anzeigen/ausblenden
    (qs("#btn-hint")).style.display = MODE === "normal" ? "inline-block" : "none";
}
// -------- events
qsa(".chip").forEach(btn => {
    btn.addEventListener("click", () => btn.classList.toggle("sel"));
});
qs("#btn-check").addEventListener("click", () => {
    if (!current)
        return;
    const chosen = selectedKasus();
    if (chosen.length === 0) {
        qs("#feedback").textContent = "Bitte wähle mindestens einen Kasus.";
        qs("#feedback").className = "row err";
        return;
    }
    // Vergleich als Sets
    const ok = chosen.length === current.kasus.length && chosen.every(k => current.kasus.includes(k));
    if (ok) {
        qs("#feedback").textContent = "Richtig! ✅";
        qs("#feedback").className = "row ok";
        setTimeout(renderAufgabe, 700);
    }
    else {
        qs("#feedback").textContent = `Leider nein. Richtige Kasus: ${current.kasus.join(", ")}`;
        qs("#feedback").className = "row err";
    }
});
qs("#btn-hint").addEventListener("click", () => {
    if (!current)
        return;
    const s = current.sub;
    const deklTxt = s.deklination === "a" ? `a-Deklination Typ ${s.typ}` : `o-Deklination`;
    const gTxt = s.genus === "m" ? "m" : s.genus === "f" ? "f" : "n";
    const nTxt = current.numerus;
    qs("#hint").textContent = `${deklTxt}, ${gTxt}, ${nTxt}`;
});
qs("#btn-next").addEventListener("click", renderAufgabe);
// -------- init
(async function start() {
    const [rows, sList] = await Promise.all([ladeGrEndungenRows(), ladeGrSubstantive()]);
    endIdx = buildGrEndungenIndex(rows);
    // nur Substantive, für die es Endungen gibt
    subs = sList.filter(s => endIdx.has(`${s.deklination}|${s.typ}|${s.genus}`));
    renderAufgabe();
})();
