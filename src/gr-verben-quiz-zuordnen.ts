import {
    loadGreekEndingsCsv,
    loadGreekVerbsCsv,
    buildGreekForms,
    PERSONEN,
    NUMERI,
    type Person, type Numerus, type GrVerb,
} from "./utils/greek-verb-forms.js";
// optional: globaler Hover für Tooltips
// import "./utils/hover-global.js";

type Modus = "indikativ" | "imperativ";
type Tempus = "praesens";
type Diathese = "aktiv";

const TEMPI: ReadonlyArray<Tempus> = ["praesens"];
const MODI: ReadonlyArray<Modus> = ["indikativ", "imperativ"];
const DIATHESEN: ReadonlyArray<Diathese> = ["aktiv"];

function $(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`#${id} nicht gefunden`);
    return el;
}
function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Record<string, string>) {
    const e = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
}
function pick<T>(arr: ReadonlyArray<T>): T {
    return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(a: ReadonlyArray<T>): T[] {
    return a.map(v => [Math.random(), v] as const).sort((x,y)=>x[0]-y[0]).map(([,v])=>v);
}

let VERBEN: ReadonlyArray<GrVerb> = [];
let ENDS: Awaited<ReturnType<typeof loadGreekEndingsCsv>> = [];

let CUR:
    | { verb: GrVerb; tempus: Tempus; modus: Modus; diathese: Diathese;
    tbl: Record<Person, Record<Numerus, string>>;
    cells: Array<{ p: Person; n: Numerus; form: string }>;
}
    | null = null;

let ERRORS = 0;

function renderGrid(tbl: Record<Person, Record<Numerus, string>>, modus: Modus) {
    const host = $("grid");
    host.innerHTML = "";

    const showPersons: ReadonlyArray<Person> = modus === "imperativ" ? (["2","3"] as const) : (["1","2","3"] as const);
    const usedNumeri = NUMERI.filter(n => showPersons.some(p => tbl[p][n] && tbl[p][n] !== "—"));

    const table = el("table", { class: "konjtbl" });
    const thead = el("thead");
    const trh = el("tr");
    trh.appendChild(el("th"));
    for (const n of usedNumeri) {
        const th = el("th"); th.textContent = n.toUpperCase();
        trh.appendChild(th);
    }
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = el("tbody");
    for (const p of showPersons) {
        const tr = el("tr");
        const th = el("th"); th.textContent = `${p}. Person`;
        tr.appendChild(th);

        for (const n of usedNumeri) {
            const f = tbl[p][n];
            const td = el("td", { class: "dropcell", "data-p": p, "data-n": n }) as HTMLTableCellElement;
            if (!f || f === "—") {
                // sollte im Präsens kaum vorkommen, aber der Code bleibt generisch
                td.classList.add("muted");
                td.textContent = "—";
            } else {
                td.textContent = "";
                enableDrop(td);
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    host.appendChild(table);
}

function renderPool(forms: string[]) {
    const pool = $("pool");
    pool.innerHTML = "";
    for (const f of shuffle(forms)) {
        const chip = el("div", { class: "chip", draggable: "true" });
        chip.textContent = f;
        enableDrag(chip);
        pool.appendChild(chip);
    }
}

function fillLabels(verb: GrVerb, tempus: Tempus, modus: Modus, diathese: Diathese) {
    ($("lemma") as HTMLDivElement).textContent = verb.lemma;
    ($("lab-tempus") as HTMLSpanElement).textContent = tempus;
    ($("lab-modus") as HTMLSpanElement).textContent = modus;
    ($("lab-diathese") as HTMLSpanElement).textContent = diathese;
    ($("errors") as HTMLSpanElement).textContent = String(ERRORS);
    ($("hint") as HTMLSpanElement).textContent = "";
    ($("feedback") as HTMLDivElement).innerHTML = "";
}

function allPlaced(): boolean {
    if (!CUR) return false;
    const expected = CUR.cells.length;
    const placed = Array.from($("grid").querySelectorAll<HTMLTableCellElement>("td.dropcell.ok")).length;
    return placed >= expected;
}

/* ---------- Drag & Drop ---------- */

function enableDrag(node: HTMLElement) {
    node.addEventListener("dragstart", (ev: DragEvent) => {
        node.classList.add("dragging");
        ev.dataTransfer?.setData("text/plain", node.textContent || "");
        ev.dataTransfer!.effectAllowed = "move";
    });
    node.addEventListener("dragend", () => node.classList.remove("dragging"));
}

function enableDrop(cell: HTMLTableCellElement) {
    cell.addEventListener("dragover", (ev: DragEvent) => {
        ev.preventDefault();
        cell.classList.add("droptarget");
        ev.dataTransfer!.dropEffect = "move";
    });
    cell.addEventListener("dragleave", () => cell.classList.remove("droptarget"));
    cell.addEventListener("drop", (ev: DragEvent) => {
        ev.preventDefault();
        cell.classList.remove("droptarget");
        if (!CUR) return;

        if (cell.classList.contains("ok")) return; // schon korrekt gefüllt

        const p = cell.getAttribute("data-p") as Person;
        const n = cell.getAttribute("data-n") as Numerus;
        const expected = CUR.tbl[p][n];
        const dropped = (ev.dataTransfer?.getData("text/plain") || "").trim();

        const ok = normalizeGreek(dropped) === normalizeGreek(expected);
        const dragging = document.querySelector<HTMLElement>(".chip.dragging");

        if (ok) {
            cell.textContent = dropped;
            cell.classList.remove("bad");
            cell.classList.add("ok");
            if (dragging && dragging.parentElement) dragging.parentElement.removeChild(dragging);

            if (allPlaced()) {
                ($("feedback") as HTMLDivElement).innerHTML = `<span class="ok">✓ Alles korrekt zugeordnet!</span>`;
            }
        } else {
            cell.classList.remove("ok");
            cell.classList.add("bad");
            ERRORS++;
            ($("errors") as HTMLSpanElement).textContent = String(ERRORS);
            setTimeout(() => cell.classList.remove("bad"), 350);
        }
    });
}

/* ---------- Normalisierung (minimal) ---------- */

function normalizeGreek(s: string): string {
    // Entfernt Diakritika, vereinheitlicht Whitespace (nicht zu aggressiv)
    return s
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

/* ---------- Task ---------- */

async function newTask() {
    if (VERBEN.length === 0 || ENDS.length === 0) return;

    const verb = pick(VERBEN);
    const tempus: Tempus = "praesens"; // aktuell nur Präsens
    const modus: Modus = pick(MODI);
    const diath: Diathese = "aktiv";

    const tbl = buildGreekForms(verb, tempus, modus, diath, ENDS);
    // Sammle alle existierenden Zellen (keine "—")
    const showPersons: ReadonlyArray<Person> = modus === "imperativ" ? (["2","3"] as const) : (["1","2","3"] as const);
    const cells: Array<{ p: Person; n: Numerus; form: string }> = [];
    for (const p of showPersons) {
        for (const n of NUMERI) {
            const f = tbl[p][n];
            if (f && f !== "—") cells.push({ p, n, form: f });
        }
    }
    if (cells.length === 0) return newTask(); // Sicherheitsnetz

    CUR = { verb, tempus, modus, diathese: diath, tbl, cells };
    ERRORS = 0;
    fillLabels(verb, tempus, modus, diath);
    renderGrid(tbl, modus);
    renderPool(cells.map(c => c.form));
}

/* ---------- Init ---------- */

(async function init() {
    [VERBEN, ENDS] = await Promise.all([loadGreekVerbsCsv(), loadGreekEndingsCsv()]);

    $("btn-new").addEventListener("click", () => { void newTask(); });
    $("btn-solve").addEventListener("click", () => {
        if (!CUR) return;
        $("pool").innerHTML = "";
        // Alle Zellen füllen
        const tds = Array.from($("grid").querySelectorAll<HTMLTableCellElement>("td.dropcell"));
        for (const cell of tds) {
            const p = cell.getAttribute("data-p") as Person;
            const n = cell.getAttribute("data-n") as Numerus;
            const val = CUR.tbl[p][n];
            if (!val || val === "—") continue;
            cell.textContent = val;
            cell.classList.add("ok");
            cell.classList.remove("bad");
        }
        ($("feedback") as HTMLDivElement).innerHTML = `<span class="muted">Lösung eingetragen.</span>`;
    });

    await newTask();
})();
