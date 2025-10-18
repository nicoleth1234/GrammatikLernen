// src/quizPassive.ts
import { ladeSubstantive } from "./utils/substantive-loader.js";
import { ladeCsvDatei } from "./utils/csv-loader.js";
import { buildEndungenIndex, keyOf } from "./utils/endung-index.js";
import { bildeFormenDyn } from "./utils/morpho.js";
import { Kasus, Numerus } from "./models/models.js";
// --- Helpers ---
const KASUS_NO_VOK = [Kasus.Nom, Kasus.Gen, Kasus.Dat, Kasus.Akk, Kasus.Abl];
function normalize(s) {
    return (s || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
// erzeugt die Frage: wählt eine Form != Vokativ
function makeQuestion(s, endIdx) {
    const formen = bildeFormenDyn(s, endIdx);
    // Kandidaten = alle (Kasus != Vok) × (Sg/Pl)
    const candidates = [];
    for (const k of KASUS_NO_VOK) {
        for (const n of [Numerus.Sg, Numerus.Pl]) {
            const f = formen[k][n];
            if (f && f !== "—") {
                candidates.push({ kasus: k, numerus: n, form: f });
            }
        }
    }
    const chosen = pickRandom(candidates);
    const surfNorm = normalize(chosen.form);
    // alle Kasus sammeln, die (Sg oder Pl) die gleiche Oberfläche haben
    const korrekte = new Set();
    for (const k of KASUS_NO_VOK) {
        const fSg = normalize(formen[k][Numerus.Sg]);
        const fPl = normalize(formen[k][Numerus.Pl]);
        if (fSg === surfNorm || fPl === surfNorm)
            korrekte.add(k);
    }
    return { surface: chosen.form, korrekteKasus: korrekte, subst: s };
}
// --- UI refs ---
const wordEl = document.getElementById("word");
const hintEl = document.getElementById("hint");
const fbEl = document.getElementById("feedback");
const buttonsWrap = document.getElementById("buttons");
let current = null;
let endIdx;
let substantive = [];
function setFeedback(msg, ok) {
    fbEl.textContent = msg;
    fbEl.className = ok ? "ok" : "err";
}
function renderQuestion() {
    const s = pickRandom(substantive);
    current = makeQuestion(s, endIdx);
    wordEl.textContent = current.surface;
    hintEl.textContent = `${s.nomSg} (${s.dekl}, ${s.genus})`; // optionaler Hinweis
    setFeedback("", true);
}
async function start() {
    try {
        const [subst, endRows] = await Promise.all([
            ladeSubstantive(),
            (async () => {
                const csv = await ladeCsvDatei("assets/data/deklinationen.csv");
                const header = csv[0];
                const idx = {
                    Deklination: header.indexOf("Deklination"),
                    Kasus: header.indexOf("Kasus"),
                    Genus: header.indexOf("Genus"),
                    Numerus: header.indexOf("Numerus"),
                    Endung: header.indexOf("Endung"),
                };
                for (const [k, v] of Object.entries(idx))
                    if (v === -1)
                        throw new Error(`CSV-Header fehlt Spalte: ${k}`);
                // als Deklination-Objekte einlesen (nur für buildEndungenIndex)
                return csv.slice(1).map(r => ({
                    deklination: r[idx.Deklination].trim(),
                    kasus: r[idx.Kasus].trim(),
                    genus: r[idx.Genus].trim(),
                    numerus: r[idx.Numerus].trim(),
                    endung: r[idx.Endung].trim(),
                }));
            })()
        ]);
        substantive = subst;
        endIdx = buildEndungenIndex(endRows); // Typ passt zu unserer Builder-Funktion
        // filtere Substantive, für die wir auch Endungen haben
        substantive = substantive.filter(s => endIdx.has(keyOf(s.dekl, s.genus)));
        renderQuestion();
        // Button-Handler (Delegation)
        buttonsWrap.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-kasus]");
            if (!btn || !current)
                return;
            const chosenKasus = btn.getAttribute("data-kasus");
            const ok = current.korrekteKasus.has(chosenKasus);
            if (ok) {
                setFeedback("Richtig! ✅", true);
                setTimeout(renderQuestion, 650);
            }
            else {
                // zeige, welche Kasus akzeptiert sind
                const correctList = Array.from(current.korrekteKasus).join(", ");
                setFeedback(`Leider nein. Richtig wäre: ${correctList}`, false);
            }
        });
    }
    catch (err) {
        console.error(err);
        wordEl.textContent = "Fehler beim Laden.";
    }
}
start();
