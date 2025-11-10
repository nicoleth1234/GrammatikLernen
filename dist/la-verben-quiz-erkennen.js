import { ladeEndungen, ladeVerben, ladeIrreg, ladeIrregAlsVerben, } from "./utils/la-verb-loader.js";
import { buildEndungsIndex, buildIrregIndex, buildForms } from "./utils/la-verb-forms.js";
const TEMPI = ["Praesens", "Imperfekt", "Perfekt", "Plusquamperfekt"];
const MODI = ["Indikativ", "Imperativ"];
const DIATHESEN = ["Aktiv", "Passiv"];
const PERSONEN = ["1", "2", "3"];
const NUMERI = ["Sg", "Pl"];
function $(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`Element #${id} nicht gefunden`);
    return el;
}
function setOptions(sel, values) {
    sel.innerHTML = values.map(v => `<option value="${v}">${v}</option>`).join("");
}
function normLatin(s) {
    // Tolerant gegenüber Gross/Klein, Makronen/Akzenten, i/j, u/v, Whitespace
    return s
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/j/g, "i")
        .replace(/v/g, "u")
        .replace(/[^a-z]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
let END_IDX;
let IRR_IDX;
let VERBEN = [];
let cur = null;
let errors = 0;
async function nextTask() {
    const verb = pick(VERBEN);
    const tempus = pick(TEMPI);
    const modus = pick(MODI);
    const diathese = pick(DIATHESEN);
    const table = buildForms(verb, END_IDX, IRR_IDX, tempus, modus, diathese);
    const candidates = [];
    for (const p of PERSONEN) {
        for (const n of NUMERI) {
            const f = table[p][n];
            if (f && f !== "—")
                candidates.push({ p, n, form: f });
        }
    }
    // Falls eine (gewählte) Kombination keine Formen liefert, erneut versuchen
    if (candidates.length === 0)
        return nextTask();
    const cell = pick(candidates);
    cur = {
        infinitiv: verb.infinitiv || verb.lemma,
        tempus,
        modus,
        diathese,
        person: cell.p,
        numerus: cell.n,
        form: cell.form,
    };
    // UI setzen/zurücksetzen
    $("prompt").textContent = cur.form;
    $("inf").value = "";
    $("tempus").value = "";
    $("modus").value = "";
    $("diathese").value = "";
    $("person").value = "";
    $("numerus").value = "";
    $("#feedback").innerHTML = "";
}
function check() {
    if (!cur)
        return;
    const okInf = normLatin($("inf").value) === normLatin(cur.infinitiv);
    const okTempus = $("tempus").value === cur.tempus;
    const okModus = $("modus").value === cur.modus;
    const okDiathese = $("diathese").value === cur.diathese;
    const okPerson = $("person").value === cur.person;
    const okNumerus = $("numerus").value === cur.numerus;
    const allOk = okInf && okTempus && okModus && okDiathese && okPerson && okNumerus;
    const fb = $("feedback");
    if (allOk) {
        fb.innerHTML = `<span class="ok">✓ Richtig!</span>`;
        setTimeout(() => { void nextTask(); }, 400);
    }
    else {
        errors++;
        $("errors").textContent = String(errors);
        const miss = [];
        if (!okInf)
            miss.push("Infinitiv");
        if (!okTempus)
            miss.push("Tempus");
        if (!okModus)
            miss.push("Modus");
        if (!okDiathese)
            miss.push("Diathese");
        if (!okPerson)
            miss.push("Person");
        if (!okNumerus)
            miss.push("Numerus");
        fb.innerHTML = `<span class="warn">✗ Nicht ganz. Prüfe: ${miss.join(", ")}</span>`;
    }
}
function showSolution() {
    if (!cur)
        return;
    const t = cur;
    const fb = $("feedback");
    fb.innerHTML = `<div class="muted">Lösung: ${t.infinitiv}; ${t.tempus}, ${t.modus}, ${t.diathese}; ${t.person}. ${t.numerus}</div>`;
}
(async function init() {
    // Dropdown-Optionen
    setOptions($("tempus"), ["", ...TEMPI]);
    setOptions($("modus"), ["", ...MODI]);
    setOptions($("diathese"), ["", ...DIATHESEN]);
    setOptions($("person"), ["", ...PERSONEN]);
    setOptions($("numerus"), ["", ...NUMERI]);
    // Daten laden
    const [endungen, verben, irreg, irregVerben] = await Promise.all([
        ladeEndungen(),
        ladeVerben(),
        ladeIrreg(),
        ladeIrregAlsVerben()
    ]);
    END_IDX = buildEndungsIndex(endungen);
    IRR_IDX = buildIrregIndex(irreg);
    // Alle Verben: regulär + irregulär (als „VerbRow“)
    VERBEN = [...verben, ...irregVerben];
    errors = 0;
    $("errors").textContent = "0";
    // Events
    $("btn-submit").addEventListener("click", () => check());
    $("btn-next").addEventListener("click", () => { void nextTask(); });
    $("btn-show").addEventListener("click", () => showSolution());
    $("inf").addEventListener("keydown", (e) => {
        if (e.key === "Enter")
            check();
    });
    await nextTask();
})();
