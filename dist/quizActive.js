// src/quizActive.ts
import { ladeCsvDatei } from "./utils/csv-loader.js";
import { Deklination, Deklinationen, Genus, Numerus, Kasus } from "./models/models.js";
const KASUS_ORDER = [Kasus.Nom, Kasus.Gen, Kasus.Dat, Kasus.Akk, Kasus.Abl, Kasus.Vok];
// ---------- Parser ----------
function parseDeklination(v) {
    switch (v) {
        case Deklinationen.A: return Deklinationen.A;
        case Deklinationen.O: return Deklinationen.O;
        case Deklinationen.Dritte: return Deklinationen.Dritte;
        default: throw new Error(`Unbekannte Deklination: ${v}`);
    }
}
function parseGenus(v) {
    switch (v) {
        case Genus.M: return Genus.M;
        case Genus.F: return Genus.F;
        case Genus.N: return Genus.N;
        default: throw new Error(`Unbekanntes Genus: ${v}`);
    }
}
function parseNumerus(v) {
    switch (v) {
        case Numerus.Sg: return Numerus.Sg;
        case Numerus.Pl: return Numerus.Pl;
        default: throw new Error(`Unbekannter Numerus: ${v}`);
    }
}
function parseKasus(v) {
    switch (v) {
        case Kasus.Nom: return Kasus.Nom;
        case Kasus.Gen: return Kasus.Gen;
        case Kasus.Dat: return Kasus.Dat;
        case Kasus.Akk: return Kasus.Akk;
        case Kasus.Abl: return Kasus.Abl;
        case Kasus.Vok: return Kasus.Vok;
        default: throw new Error(`Unbekannter Kasus: ${v}`);
    }
}
async function ladeAlle() {
    const csv = await ladeCsvDatei("assets/data/deklinationen.csv");
    if (csv.length === 0)
        return [];
    const header = csv[0];
    const i = {
        Deklination: header.indexOf("Deklination"),
        Kasus: header.indexOf("Kasus"),
        Genus: header.indexOf("Genus"),
        Numerus: header.indexOf("Numerus"),
        Endung: header.indexOf("Endung"),
    };
    for (const [k, v] of Object.entries(i))
        if (v === -1)
            throw new Error(`CSV-Header fehlt Spalte: ${k}`);
    return csv.slice(1).map(r => new Deklination(parseDeklination(r[i.Deklination]), parseKasus(r[i.Kasus]), parseGenus(r[i.Genus]), parseNumerus(r[i.Numerus]), r[i.Endung].trim()));
}
class QuizEngine {
    constructor(daten) {
        this.pool = [];
        // erlaubte Kombinationen: a(f), o(m), o(n), 3(m), 3(n)
        const erlaubt = daten.filter(d => (d.deklination === Deklinationen.A && d.genus === Genus.F) ||
            (d.deklination === Deklinationen.O && (d.genus === Genus.M || d.genus === Genus.N)) ||
            (d.deklination === Deklinationen.Dritte && (d.genus === Genus.M || d.genus === Genus.N)));
        for (const e of erlaubt) {
            this.pool.push({
                dekl: e.deklination,
                genus: e.genus,
                kasus: e.kasus,
                numerus: e.numerus,
                antwort: e.endung
            });
        }
    }
    next() {
        this.current = this.pool[Math.floor(Math.random() * this.pool.length)];
        return this.current;
    }
    getCurrent() { return this.current; }
}
function normalizeForCompare(s) {
    return (s || "")
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Diakritika weg (Makron etc.)
}
// ---------- UI ----------
const qText = document.getElementById("q-text");
const input = document.getElementById("answer");
const btnSubmit = document.getElementById("btn-submit");
const btnShow = document.getElementById("btn-show");
const feedback = document.getElementById("feedback");
let engine;
function renderFrage(f) {
    qText.textContent = `${f.dekl}-Deklination ${f.kasus} ${f.numerus} ${f.genus}`;
    input.value = "";
    input.focus();
    feedback.textContent = "";
    feedback.className = "";
}
function setFeedback(msg, ok) {
    feedback.textContent = msg;
    feedback.className = ok ? "ok" : "err";
}
function naechsteFrage(delayMs = 600) {
    setTimeout(() => renderFrage(engine.next()), delayMs);
}
async function start() {
    try {
        const alle = await ladeAlle();
        engine = new QuizEngine(alle);
        renderFrage(engine.next());
    }
    catch (e) {
        qText.textContent = "Fehler beim Laden.";
        console.error(e);
    }
}
btnSubmit.addEventListener("click", () => {
    const cur = engine.getCurrent();
    if (!cur)
        return;
    const ok = normalizeForCompare(input.value) === normalizeForCompare(cur.antwort);
    if (ok) {
        setFeedback("Gut gemacht! ✅", true);
        naechsteFrage();
    }
    else {
        setFeedback("Leider nein. Versuchs nochmal oder ‚Zeige Lösung‘.", false);
    }
});
btnShow.addEventListener("click", () => {
    const cur = engine.getCurrent();
    if (!cur)
        return;
    setFeedback(`Lösung: ${cur.antwort}`, false);
    naechsteFrage(1000);
});
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter")
        btnSubmit.click();
});
start();
