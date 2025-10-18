// src/quizForm.ts
import { ladeSubstantive, Substantiv } from "./utils/substantive-loader.js";
import { ladeCsvDatei } from "./utils/csv-loader.js";
import { buildEndungenIndex } from "./utils/endung-index.js";
import { bildeFormenDyn, KASUS_ORDER } from "./utils/morpho.js";
import { Deklinationen, Genus, Kasus, Numerus } from "./models/models.js";

// UI Refs
const taskEl = document.getElementById("task")!;
const inputEl = document.getElementById("answer") as HTMLInputElement;
const btnSubmit = document.getElementById("btn-submit") as HTMLButtonElement;
const btnSolution = document.getElementById("btn-solution") as HTMLButtonElement;
const btnHint = document.getElementById("btn-hint") as HTMLButtonElement;
const btnNext = document.getElementById("btn-next") as HTMLButtonElement;
const hintEl = document.getElementById("hint")!;
const fbEl = document.getElementById("feedback")!;
const streakEl = document.getElementById("streak")!;

// Wir verwenden alle 6 Kasus inkl. Vokativ (falls du Vokativ später ausschalten willst, Liste anpassen)
const KASUS_FOR_QUIZ: Kasus[] = KASUS_ORDER;

function normalize(s: string): string {
    // macht Gross-/Kleinschreibung und Längenzeichen egal
    return (s || "")
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Diakritika weg (Makron etc.)
}

function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

type Frage = {
    subst: Substantiv;
    kasus: Kasus;
    numerus: Numerus;
    correct: string;
};

let endIdx: ReturnType<typeof buildEndungenIndex>;
let substantive: Substantiv[] = [];
let current: Frage | null = null;
let streak = 0;

function updateStreakDisplay() {
    streakEl.textContent = `Streak: ${streak}`;
}

function buildQuestion(): Frage {
    const s = pick(substantive);
    const formen = bildeFormenDyn(s, endIdx);
    const k = pick(KASUS_FOR_QUIZ);
    const n = pick([Numerus.Sg, Numerus.Pl] as const);
    const correct = formen[k][n];
    return { subst: s, kasus: k, numerus: n, correct };
}

function renderQuestion() {
    current = buildQuestion();
    const { subst, kasus, numerus } = current;

    // Aufgabe-Text nach Wunsch (ohne "Lemma")
    taskEl.textContent = `Bilde ${kasus} ${numerus} von ${subst.nomSg}`;

    inputEl.value = "";
    inputEl.focus();
    hintEl.textContent = "";
    fbEl.textContent = "";
    fbEl.className = "";
    // Hinweis-Button ist von Beginn an sichtbar:
    (btnHint as HTMLButtonElement).style.display = "inline-block";
}

function setFeedback(msg: string, ok: boolean) {
    fbEl.textContent = msg;
    fbEl.className = ok ? "ok" : "err";
}

// --- Events ---
btnSubmit.addEventListener("click", () => {
    if (!current) return;
    const ok = normalize(inputEl.value) === normalize(current.correct);
    if (ok) {
        streak += 1;
        updateStreakDisplay();
        setFeedback("Richtig! ✅", true);
        setTimeout(renderQuestion, 600);
    } else {
        streak = 0; // bei Fehler Streak zurücksetzen
        updateStreakDisplay();
        setFeedback("Leider nein. Versuch’s nochmals oder nutze «Lösung» / «Hinweis».", false);
    }
});

btnSolution.addEventListener("click", () => {
    if (!current) return;
    streak = 0; // Lösung genutzt → Streak resetten
    updateStreakDisplay();
    setFeedback(`Lösung: ${current.correct}`, false);
    setTimeout(renderQuestion, 900);
});

btnHint.addEventListener("click", () => {
    if (!current) return;
    const { subst } = current;
    hintEl.textContent = `${subst.dekl}-Deklination, ${subst.genus}`;
    // Button ausblenden (unterhalb der anderen Buttons platziert)
    (btnHint as HTMLButtonElement).style.display = "none";
});

btnNext.addEventListener("click", renderQuestion);
inputEl.addEventListener("keydown", (e) => { if (e.key === "Enter") btnSubmit.click(); });

// --- Init ---
async function start() {
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
            for (const [k, v] of Object.entries(idx)) if (v === -1) throw new Error(`CSV-Header fehlt Spalte: ${k}`);
            return csv.slice(1).map(r => ({
                deklination: r[idx.Deklination].trim() as unknown as Deklinationen,
                kasus: r[idx.Kasus].trim() as unknown as Kasus,
                genus: r[idx.Genus].trim() as unknown as Genus,
                numerus: r[idx.Numerus].trim() as unknown as Numerus,
                endung: r[idx.Endung].trim(),
            }));
        })()
    ]);

    endIdx = buildEndungenIndex(endRows as any);
    substantive = subst.filter(s => endIdx.has(`${s.dekl}|${s.genus}` as any));

    streak = 0;
    updateStreakDisplay();
    renderQuestion();
}

start();
