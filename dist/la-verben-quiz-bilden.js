import { ladeEndungen, ladeVerben, ladeIrreg } from "./utils/la-verb-loader.js";
import { buildEndungsIndex, buildIrregIndex, buildForms } from "./utils/la-verb-forms.js";
// Konfiguration des Quizes
const tempi = ["Praesens", "Imperfekt", "Perfekt", "Plusquamperfekt"];
const modi = ["Indikativ"];
const diathesen = ["Aktiv"];
const personen = ["1", "2", "3"];
const numeri = ["Sg", "Pl"];
// Normalisierung: ohne Längen/Akzente, case-insensitive, u~v, i~j, ohne Spaces
function normalizeLatin(s) {
    const map = {
        "ā": "a", "ē": "e", "ī": "i", "ō": "o", "ū": "u", "ȳ": "y",
        "Ā": "a", "Ē": "e", "Ī": "i", "Ō": "o", "Ū": "u", "Ȳ": "y",
    };
    let out = s.trim().toLowerCase();
    out = out.replace(/[ĀĒĪŌŪȲāēīōūȳ]/g, ch => { var _a; return (_a = map[ch]) !== null && _a !== void 0 ? _a : ch; });
    out = out.replace(/v/g, "u").replace(/j/g, "i");
    out = out.replace(/\s+/g, "");
    return out;
}
function stemFor(verb, tempus) {
    return (tempus === "Perfekt" || tempus === "Plusquamperfekt") ? verb.perfektstamm : verb.praesensstamm;
}
let VERBEN = [];
let END_IDX;
let IRR_IDX;
const el = {
    qLemma: document.getElementById("q-lemma"),
    qSpec: document.getElementById("q-spec"),
    answer: document.getElementById("answer"),
    feedback: document.getElementById("feedback"),
    errors: document.getElementById("errors"),
    btnSubmit: document.getElementById("btn-submit"),
    btnHint: document.getElementById("btn-hint"),
    btnShow: document.getElementById("btn-show"),
};
let errorCount = 0;
let curTask = null;
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function spec(t) {
    const p = `${t.person}.`;
    const n = t.numerus === "Sg" ? "Sg." : "Pl.";
    return `${t.modus}, ${t.tempus}, ${t.diathese}, ${p} P. ${n}`;
}
function pickTask() {
    const verb = rand(VERBEN);
    const tempus = rand(tempi);
    const modus = rand(modi);
    const diathese = rand(diathesen);
    const person = rand(personen);
    const numerus = rand(numeri);
    const forms = buildForms(verb, END_IDX, IRR_IDX, tempus, modus, diathese);
    const solution = forms[person][numerus] || "—";
    return { verb, tempus, modus, diathese, person, numerus, solution };
}
function showTask(t) {
    el.qLemma.textContent = t.verb.infinitiv;
    el.qSpec.textContent = spec(t);
    el.answer.value = "";
    el.feedback.textContent = "";
    el.answer.focus();
}
function checkAnswer() {
    if (!curTask)
        return;
    const user = normalizeLatin(el.answer.value);
    const sol = normalizeLatin(curTask.solution);
    if (!sol || sol === "—") {
        el.feedback.innerHTML = `<span class="err">Für diese Kombination wurde keine Form gefunden.</span>`;
        return;
    }
    if (user === sol) {
        el.feedback.innerHTML = `<span class="ok">Richtig!</span>`;
        curTask = pickTask();
        showTask(curTask);
    }
    else {
        errorCount++;
        el.errors.textContent = String(errorCount);
        el.feedback.innerHTML = `<span class="err">Leider falsch. Versuche es noch einmal.</span>`;
    }
}
function showHint() {
    if (!curTask)
        return;
    el.feedback.innerHTML = `<span class="muted">Hinweis (Stamm): <code>${stemFor(curTask.verb, curTask.tempus)}</code></span>`;
}
function showSolution() {
    if (!curTask)
        return;
    el.feedback.innerHTML = `<span class="ok">Lösung: <code>${curTask.solution}</code></span>`;
}
(async function init() {
    const [endungen, verben, irreg] = await Promise.all([ladeEndungen(), ladeVerben(), ladeIrreg()]);
    END_IDX = buildEndungsIndex(endungen);
    IRR_IDX = buildIrregIndex(irreg);
    VERBEN = verben;
    errorCount = 0;
    el.errors.textContent = "0";
    curTask = pickTask();
    showTask(curTask);
    el.btnSubmit.addEventListener("click", checkAnswer);
    el.answer.addEventListener("keydown", (e) => { if (e.key === "Enter")
        checkAnswer(); });
    el.btnHint.addEventListener("click", showHint);
    el.btnShow.addEventListener("click", showSolution);
})();
