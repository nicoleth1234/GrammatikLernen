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
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(a) { return a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(([, v]) => v); }
let END_IDX;
let IRR_IDX;
let VERBEN = [];
let CUR = null;
let ERRORS = 0;
function buildTask(verb, tempus, modus, diathese) {
    const tbl = buildForms(verb, END_IDX, IRR_IDX, tempus, modus, diathese);
    const cells = [];
    for (const p of PERSONEN) {
        for (const n of NUMERI) {
            const f = tbl[p][n];
            if (f && f !== "—")
                cells.push({ p, n, expected: f });
        }
    }
    return {
        verb,
        infinitiv: verb.infinitiv || verb.lemma,
        tempus, modus, diathese,
        expectedTable: tbl,
        cells,
    };
}
function renderGrid(task) {
    const host = $("grid");
    host.innerHTML = "";
    const usedNumeri = NUMERI.filter(n => task.cells.some(c => c.n === n));
    const usedPersonen = PERSONEN.filter(p => task.cells.some(c => c.p === p));
    const tbl = el("table", { class: "konjtbl" });
    const thead = el("thead");
    const trh = el("tr");
    trh.appendChild(el("th"));
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
            const hasCell = task.cells.some(c => c.p === p && c.n === n);
            const td = el("td", { class: "dropcell", "data-p": p, "data-n": n });
            if (!hasCell) {
                // ungültige Kombi (z. B. 1. Sg Imperativ) → leere, inaktive Zelle
                td.classList.add("muted");
                td.textContent = "—";
            }
            else {
                td.textContent = ""; // leer, droppbar
                enableDrop(td);
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    tbl.appendChild(tbody);
    host.appendChild(tbl);
}
function renderPool(task) {
    const pool = $("pool");
    pool.innerHTML = "";
    const forms = shuffle(task.cells.map(c => c.expected));
    for (const f of forms) {
        const chip = el("div", { class: "chip", draggable: "true" });
        chip.textContent = f;
        enableDrag(chip);
        pool.appendChild(chip);
    }
}
function fillLabels(task) {
    $("infinitiv").textContent = task.infinitiv;
    $("lab-tempus").textContent = task.tempus;
    $("lab-modus").textContent = task.modus;
    $("lab-diathese").textContent = task.diathese;
    $("errors").textContent = String(ERRORS);
    $("hint").textContent = "";
    $("feedback").innerHTML = "";
}
function normLatin(s) {
    return s
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/j/g, "i")
        .replace(/v/g, "u")
        .replace(/[^a-z]/g, " ")
        .replace(/\s+/g, " ").trim();
}
function allPlaced() {
    if (!CUR)
        return false;
    const expectedCount = CUR.cells.length;
    const placed = Array.from($("grid").querySelectorAll("td.dropcell.ok")).length;
    return placed >= expectedCount;
}
/* ---------- Drag & Drop ---------- */
function enableDrag(elm) {
    elm.addEventListener("dragstart", (ev) => {
        var _a;
        elm.classList.add("dragging");
        (_a = ev.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData("text/plain", elm.textContent || "");
        ev.dataTransfer.effectAllowed = "move";
    });
    elm.addEventListener("dragend", () => {
        elm.classList.remove("dragging");
    });
}
function enableDrop(cell) {
    cell.addEventListener("dragover", (ev) => {
        ev.preventDefault();
        cell.classList.add("droptarget");
        ev.dataTransfer.dropEffect = "move";
    });
    cell.addEventListener("dragleave", () => {
        cell.classList.remove("droptarget");
    });
    cell.addEventListener("drop", (ev) => {
        var _a;
        ev.preventDefault();
        cell.classList.remove("droptarget");
        if (!CUR)
            return;
        // Bereits korrekt gefüllt? Dann ignorieren.
        if (cell.classList.contains("ok"))
            return;
        const p = cell.getAttribute("data-p");
        const n = cell.getAttribute("data-n");
        const expected = CUR.expectedTable[p][n];
        const dropped = (((_a = ev.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData("text/plain")) || "").trim();
        const ok = normLatin(dropped) === normLatin(expected);
        // Das gezogene Element (Chip) ermitteln
        const dragging = document.querySelector(".chip.dragging");
        if (ok) {
            cell.textContent = dropped; // Wort in die Tabelle
            cell.classList.remove("bad");
            cell.classList.add("ok");
            if (dragging && dragging.parentElement)
                dragging.parentElement.removeChild(dragging);
            if (allPlaced()) {
                $("feedback").innerHTML = `<span class="ok">✓ Alles korrekt zugeordnet!</span>`;
            }
        }
        else {
            // rot markieren und Chip verbleibt/kehrt zurück in den Pool
            cell.classList.remove("ok");
            cell.classList.add("bad");
            ERRORS++;
            $("errors").textContent = String(ERRORS);
            // nach kurzer Zeit wieder neutralisieren
            setTimeout(() => cell.classList.remove("bad"), 350);
        }
    });
}
/* ---------- Aktionen ---------- */
function solveAll() {
    if (!CUR)
        return;
    // entferne alle Chips
    $("pool").innerHTML = "";
    // fülle alle Zellen
    const cells = Array.from($("grid").querySelectorAll("td.dropcell"));
    for (const cell of cells) {
        const p = cell.getAttribute("data-p");
        const n = cell.getAttribute("data-n");
        const expected = CUR.expectedTable[p][n];
        if (!expected || expected === "—")
            continue;
        cell.textContent = expected;
        cell.classList.add("ok");
        cell.classList.remove("bad");
    }
    $("feedback").innerHTML = `<span class="muted">Lösung eingetragen.</span>`;
}
function showHint() {
    if (!CUR)
        return;
    const { verb, tempus, modus, diathese } = CUR;
    for (const p of PERSONEN) {
        for (const n of NUMERI) {
            const form = CUR.expectedTable[p][n];
            if (!form || form === "—")
                continue;
            const end = END_IDX.get(verb.konj, tempus, modus, diathese, p, n) || "";
            let stem = form;
            if (end && form.endsWith(end))
                stem = form.slice(0, form.length - end.length);
            $("hint").textContent = `Stamm: ${stem}`;
            return;
        }
    }
    $("hint").textContent = "Stamm: —";
}
async function newTask() {
    if (!END_IDX || !IRR_IDX || VERBEN.length === 0)
        return;
    const verb = pick(VERBEN);
    const tempus = pick(TEMPI);
    const modus = pick(MODI);
    const diathese = pick(DIATHESEN);
    const task = buildTask(verb, tempus, modus, diathese);
    // falls es keine gültigen Zellen gibt, erneut
    if (task.cells.length === 0)
        return newTask();
    CUR = task;
    fillLabels(task);
    renderGrid(task);
    renderPool(task);
}
/* ---------- Init ---------- */
(async function init() {
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
    $("btn-new").addEventListener("click", () => { void newTask(); });
    $("btn-solve").addEventListener("click", () => solveAll());
    $("btn-hint").addEventListener("click", () => showHint());
    await newTask();
})();
