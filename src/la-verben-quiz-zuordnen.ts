import {
    ladeEndungen,
    ladeVerben,
    ladeIrreg,
    ladeIrregAlsVerben,
    type VerbRow,
    type Tempus,
    type Modus,
    type Diathese,
    type Person,
    type Numerus,
    type EndungsRow,
} from "./utils/la-verb-loader.js";
import { buildEndungsIndex, buildIrregIndex, buildForms } from "./utils/la-verb-forms.js";

const TEMPI: Tempus[]    = ["Praesens", "Imperfekt", "Perfekt", "Plusquamperfekt"];
const MODI: Modus[]      = ["Indikativ", "Imperativ"];
const DIATHESEN: Diathese[] = ["Aktiv", "Passiv"];
const PERSONEN: Person[] = ["1", "2", "3"];
const NUMERI: Numerus[]  = ["Sg", "Pl"];

type Task = {
    verb: VerbRow;
    infinitiv: string;
    tempus: Tempus;
    modus: Modus;
    diathese: Diathese;
    expectedTable: Record<Person, Record<Numerus, string>>; // 1..3 × Sg/Pl
    cells: Array<{ p: Person; n: Numerus; expected: string }>; // nur gültige (keine "—")
};

function $(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} nicht gefunden`);
    return el;
}
function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Record<string, string>): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
}
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle<T>(a: T[]): T[] { return a.map(v => [Math.random(), v] as const).sort((x,y)=>x[0]-y[0]).map(([,v])=>v); }

let END_IDX: ReturnType<typeof buildEndungsIndex>;
let IRR_IDX: ReturnType<typeof buildIrregIndex>;
let VERBEN: VerbRow[] = [];

let CUR: Task | null = null;
let ERRORS = 0;

function buildTask(verb: VerbRow, tempus: Tempus, modus: Modus, diathese: Diathese): Task {
    const tbl = buildForms(verb, END_IDX, IRR_IDX, tempus, modus, diathese);
    const cells: Task["cells"] = [];
    for (const p of PERSONEN) {
        for (const n of NUMERI) {
            const f = tbl[p][n];
            if (f && f !== "—") cells.push({ p, n, expected: f });
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

function renderGrid(task: Task) {
    const host = $("grid");
    host.innerHTML = "";

    const usedNumeri = NUMERI.filter(n => task.cells.some(c => c.n === n));
    const usedPersonen = PERSONEN.filter(p => task.cells.some(c => c.p === p));

    const tbl = el("table", { class: "konjtbl" });
    const thead = el("thead");
    const trh = el("tr");
    trh.appendChild(el("th"));
    for (const n of usedNumeri) {
        const th = el("th"); th.textContent = n;
        trh.appendChild(th);
    }
    thead.appendChild(trh);
    tbl.appendChild(thead);

    const tbody = el("tbody");
    for (const p of usedPersonen) {
        const tr = el("tr");
        const th = el("th"); th.textContent = `${p}. Person`;
        tr.appendChild(th);

        for (const n of usedNumeri) {
            const hasCell = task.cells.some(c => c.p === p && c.n === n);
            const td = el("td", { class: "dropcell", "data-p": p, "data-n": n });
            if (!hasCell) {
                // ungültige Kombi (z. B. 1. Sg Imperativ) → leere, inaktive Zelle
                td.classList.add("muted");
                td.textContent = "—";
            } else {
                td.textContent = ""; // leer, droppbar
                enableDrop(td as HTMLTableCellElement);
            }
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }
    tbl.appendChild(tbody);
    host.appendChild(tbl);
}

function renderPool(task: Task) {
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

function fillLabels(task: Task) {
    ($("infinitiv") as HTMLDivElement).textContent = task.infinitiv;
    ($("lab-tempus") as HTMLSpanElement).textContent = task.tempus;
    ($("lab-modus") as HTMLSpanElement).textContent = task.modus;
    ($("lab-diathese") as HTMLSpanElement).textContent = task.diathese;
    ($("errors") as HTMLSpanElement).textContent = String(ERRORS);
    ($("hint") as HTMLSpanElement).textContent = "";
    ($("feedback") as HTMLDivElement).innerHTML = "";
}

function normLatin(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/j/g, "i")
        .replace(/v/g, "u")
        .replace(/[^a-z]/g, " ")
        .replace(/\s+/g, " ").trim();
}

function allPlaced(): boolean {
    if (!CUR) return false;
    const expectedCount = CUR.cells.length;
    const placed = Array.from($("grid").querySelectorAll<HTMLTableCellElement>("td.dropcell.ok")).length;
    return placed >= expectedCount;
}

/* ---------- Drag & Drop ---------- */

function enableDrag(elm: HTMLElement) {
    elm.addEventListener("dragstart", (ev: DragEvent) => {
        elm.classList.add("dragging");
        ev.dataTransfer?.setData("text/plain", elm.textContent || "");
        ev.dataTransfer!.effectAllowed = "move";
    });
    elm.addEventListener("dragend", () => {
        elm.classList.remove("dragging");
    });
}

function enableDrop(cell: HTMLTableCellElement) {
    cell.addEventListener("dragover", (ev: DragEvent) => {
        ev.preventDefault();
        cell.classList.add("droptarget");
        ev.dataTransfer!.dropEffect = "move";
    });
    cell.addEventListener("dragleave", () => {
        cell.classList.remove("droptarget");
    });
    cell.addEventListener("drop", (ev: DragEvent) => {
        ev.preventDefault();
        cell.classList.remove("droptarget");
        if (!CUR) return;

        // Bereits korrekt gefüllt? Dann ignorieren.
        if (cell.classList.contains("ok")) return;

        const p = cell.getAttribute("data-p") as Person;
        const n = cell.getAttribute("data-n") as Numerus;
        const expected = CUR.expectedTable[p][n];
        const dropped = (ev.dataTransfer?.getData("text/plain") || "").trim();

        const ok = normLatin(dropped) === normLatin(expected);

        // Das gezogene Element (Chip) ermitteln
        const dragging = document.querySelector<HTMLElement>(".chip.dragging");

        if (ok) {
            cell.textContent = dropped;       // Wort in die Tabelle
            cell.classList.remove("bad");
            cell.classList.add("ok");
            if (dragging && dragging.parentElement) dragging.parentElement.removeChild(dragging);

            if (allPlaced()) {
                ($("feedback") as HTMLDivElement).innerHTML = `<span class="ok">✓ Alles korrekt zugeordnet!</span>`;
            }
        } else {
            // rot markieren und Chip verbleibt/kehrt zurück in den Pool
            cell.classList.remove("ok");
            cell.classList.add("bad");
            ERRORS++;
            ($("errors") as HTMLSpanElement).textContent = String(ERRORS);

            // nach kurzer Zeit wieder neutralisieren
            setTimeout(() => cell.classList.remove("bad"), 350);
        }
    });
}

/* ---------- Aktionen ---------- */

function solveAll() {
    if (!CUR) return;
    // entferne alle Chips
    $("pool").innerHTML = "";
    // fülle alle Zellen
    const cells = Array.from($("grid").querySelectorAll<HTMLTableCellElement>("td.dropcell"));
    for (const cell of cells) {
        const p = cell.getAttribute("data-p") as Person;
        const n = cell.getAttribute("data-n") as Numerus;
        const expected = CUR.expectedTable[p][n];
        if (!expected || expected === "—") continue;
        cell.textContent = expected;
        cell.classList.add("ok");
        cell.classList.remove("bad");
    }
    ($("feedback") as HTMLDivElement).innerHTML = `<span class="muted">Lösung eingetragen.</span>`;
}

function showHint() {
    if (!CUR) return;
    const { verb, tempus, modus, diathese } = CUR;
    for (const p of PERSONEN) {
        for (const n of NUMERI) {
            const form = CUR.expectedTable[p][n];
            if (!form || form === "—") continue;
            const end = END_IDX.get(verb.konj as any, tempus, modus, diathese, p, n) || "";
            let stem = form;
            if (end && form.endsWith(end)) stem = form.slice(0, form.length - end.length);
            ($("hint") as HTMLSpanElement).textContent = `Stamm: ${stem}`;
            return;
        }
    }
    ($("hint") as HTMLSpanElement).textContent = "Stamm: —";
}

async function newTask() {
    if (!END_IDX || !IRR_IDX || VERBEN.length === 0) return;

    const verb = pick(VERBEN);
    const tempus = pick(TEMPI);
    const modus = pick(MODI);
    const diathese = pick(DIATHESEN);

    const task = buildTask(verb, tempus, modus, diathese);
    // falls es keine gültigen Zellen gibt, erneut
    if (task.cells.length === 0) return newTask();

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
    ($("errors") as HTMLSpanElement).textContent = "0";

    $("btn-new").addEventListener("click", () => { void newTask(); });
    $("btn-solve").addEventListener("click", () => solveAll());
    $("btn-hint").addEventListener("click", () => showHint());

    await newTask();
})();
