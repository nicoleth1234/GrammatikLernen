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
function el(tag, attrs) {
    const e = document.createElement(tag);
    if (attrs)
        for (const [k, v] of Object.entries(attrs))
            e.setAttribute(k, v);
    return e;
}
function normLatin(s) {
    // Tolerant: Gross/Klein, Makronen/Akzente, i/j, u/v, Whitespace
    return s
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/j/g, "i")
        .replace(/v/g, "u")
        .replace(/[^a-z]/g, " ")
        .replace(/\s+/g, " ").trim();
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
let END_IDX;
let IRR_IDX;
let VERBEN = [];
let CUR = null;
let ERRORS = 0;
function buildTask(verb, tempus, modus, diathese) {
    const table = buildForms(verb, END_IDX, IRR_IDX, tempus, modus, diathese);
    const cells = [];
    for (const p of PERSONEN) {
        for (const n of NUMERI) {
            const f = table[p][n];
            if (f && f !== "—")
                cells.push({ person: p, numerus: n, expected: f });
        }
    }
    return {
        verb,
        infinitiv: verb.infinitiv || verb.lemma,
        tempus, modus, diathese,
        cells,
        expectedTable: table,
    };
}
function renderGrid(task) {
    const host = $("grid");
    host.innerHTML = "";
    // Spalten ermitteln: nur Numeri, die irgendwo vorkommen
    const usedNumeri = NUMERI.filter(nu => task.cells.some(c => c.numerus === nu));
    // Zeilen ermitteln: nur Personen, die vorkommen
    const usedPersonen = PERSONEN.filter(pe => task.cells.some(c => c.person === pe));
    const tbl = el("table", { class: "konjtbl" });
    const thead = el("thead");
    const trh = el("tr");
    trh.appendChild(el("th")); // linke Ecke leer
    for (const n of usedNumeri) {
        const th = el("th");
        th.textContent = n;
        trh.appendChild(th);
    }
    thead.appendChild(trh);
    tbl.appendChild(thead);
    const tbody = el("tbody");
    for (const p of usedPersonen) {
        const tr = el("tr");
        const th = el("th");
        th.textContent = `${p}. Person`;
        tr.appendChild(th);
        for (const n of usedNumeri) {
            const cell = task.cells.find(c => c.person === p && c.numerus === n);
            const td = el("td");
            if (cell) {
                const input = el("input", { type: "text", class: "formcell", "data-p": p, "data-n": n });
                input.autocomplete = "off";
                td.appendChild(input);
            }
            else {
                // Hier gäbe es „—“ → in diesem Quiz gar nicht anzeigen ⇒ wir lassen die Zelle leer/gestrichen
                td.appendChild(el("span", { class: "muted" }));
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    tbl.appendChild(tbody);
    host.appendChild(tbl);
}
function fillLabels(task) {
    $("infinitiv").textContent = task.infinitiv;
    $("lab-tempus").textContent = task.tempus;
    $("lab-modus").textContent = task.modus;
    $("lab-diathese").textContent = task.diathese;
}
function clearState() {
    $("hint").textContent = "";
    $("feedback").innerHTML = "";
    $("errors").textContent = String(ERRORS);
}
function getAllInputs() {
    return Array.from($("grid").querySelectorAll("input.formcell"));
}
function checkAll() {
    if (!CUR)
        return;
    let wrong = 0;
    for (const inp of getAllInputs()) {
        const p = inp.getAttribute("data-p");
        const n = inp.getAttribute("data-n");
        const expected = CUR.expectedTable[p][n];
        const ok = normLatin(inp.value) === normLatin(expected);
        inp.classList.remove("ok", "bad");
        inp.classList.add(ok ? "ok" : "bad");
        if (!ok)
            wrong++;
    }
    if (wrong === 0) {
        $("feedback").innerHTML = `<span class="ok">✓ Alles korrekt!</span>`;
    }
    else {
        ERRORS += wrong;
        $("errors").textContent = String(ERRORS);
        $("feedback").innerHTML = `<span class="bad">✗ ${wrong} Feld(er) falsch.</span>`;
    }
}
function solveAll() {
    if (!CUR)
        return;
    for (const inp of getAllInputs()) {
        const p = inp.getAttribute("data-p");
        const n = inp.getAttribute("data-n");
        const expected = CUR.expectedTable[p][n];
        inp.value = expected;
        inp.classList.remove("bad");
        inp.classList.add("ok");
    }
    $("feedback").innerHTML = `<span class="muted">Lösung eingetragen.</span>`;
}
// Stamm-Hinweis: heuristisch aus einer existierenden Form und bekannter Endung
function showHint() {
    if (!CUR)
        return;
    const { verb, tempus, modus, diathese } = CUR;
    // Nimm die erste existierende Zelle und versuche, die Endung aus dem Index zu lesen
    for (const p of PERSONEN) {
        for (const n of NUMERI) {
            const form = CUR.expectedTable[p][n];
            if (!form || form === "—")
                continue;
            const end = END_IDX.get(verb.konj, tempus, modus, diathese, p, n) || "";
            let candidate = form;
            if (end && form.endsWith(end)) {
                candidate = form.slice(0, form.length - end.length);
            }
            $("hint").textContent = `Stamm: ${candidate}`;
            return;
        }
    }
    $("hint").textContent = "Stamm: —";
}
async function newTask() {
    if (!END_IDX || !IRR_IDX || VERBEN.length === 0)
        return;
    // Zufällige Parameter
    const verb = pick(VERBEN);
    const tempus = pick(TEMPI);
    const modus = pick(MODI);
    const diathese = pick(DIATHESEN);
    const t = buildTask(verb, tempus, modus, diathese);
    // Garantieren, dass es mindestens eine Zelle gibt (z. B. Imperativ Passiv kann dünn ausfallen)
    if (t.cells.length === 0) {
        return newTask();
    }
    CUR = t;
    fillLabels(t);
    renderGrid(t);
    clearState();
}
(async function init() {
    // const [endungen, verben, irreg] = await Promise.all<[
    //     EndungsRow[],
    //     VerbRow[],
    //     ReturnType<typeof ladeIrreg>
    // ]>([
    //     ladeEndungen(),
    //     ladeVerben(),
    //     ladeIrreg(),
    // ]);
    // Daten laden
    const [endungen, verben, irreg, irregVerben] = await Promise.all([
        ladeEndungen(),
        ladeVerben(),
        ladeIrreg(),
        ladeIrregAlsVerben()
    ]);
    END_IDX = buildEndungsIndex(endungen);
    IRR_IDX = buildIrregIndex(irreg);
    VERBEN = [...verben, ...irregVerben];
    ERRORS = 0;
    $("errors").textContent = "0";
    $("btn-check").addEventListener("click", () => checkAll());
    $("btn-solve").addEventListener("click", () => solveAll());
    $("btn-hint").addEventListener("click", () => showHint());
    $("btn-new").addEventListener("click", () => { void newTask(); });
    await newTask();
})();
