import { loadGreekEndingsCsv, loadGreekVerbsCsv, buildGreekForms, NUMERI, } from "./utils/greek-verb-forms.js";
const TEMPI = ["praesens"];
const MODI = ["indikativ", "imperativ"];
const DIATHESEN = ["aktiv"];
function $(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`#${id} nicht gefunden`);
    return el;
}
function el(tag, attrs) {
    const e = document.createElement(tag);
    if (attrs)
        for (const [k, v] of Object.entries(attrs))
            e.setAttribute(k, v);
    return e;
}
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle(a) {
    return a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(([, v]) => v);
}
let VERBEN = [];
let ENDS = [];
let CUR = null;
let ERRORS = 0;
function renderGrid(tbl, modus) {
    const host = $("grid");
    host.innerHTML = "";
    const showPersons = modus === "imperativ" ? ["2", "3"] : ["1", "2", "3"];
    const usedNumeri = NUMERI.filter(n => showPersons.some(p => tbl[p][n] && tbl[p][n] !== "—"));
    const table = el("table", { class: "konjtbl" });
    const thead = el("thead");
    const trh = el("tr");
    trh.appendChild(el("th"));
    for (const n of usedNumeri) {
        const th = el("th");
        th.textContent = n.toUpperCase();
        trh.appendChild(th);
    }
    thead.appendChild(trh);
    table.appendChild(thead);
    const tbody = el("tbody");
    for (const p of showPersons) {
        const tr = el("tr");
        const th = el("th");
        th.textContent = `${p}. Person`;
        tr.appendChild(th);
        for (const n of usedNumeri) {
            const f = tbl[p][n];
            const td = el("td", { class: "dropcell", "data-p": p, "data-n": n });
            if (!f || f === "—") {
                // sollte im Präsens kaum vorkommen, aber der Code bleibt generisch
                td.classList.add("muted");
                td.textContent = "—";
            }
            else {
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
function renderPool(forms) {
    const pool = $("pool");
    pool.innerHTML = "";
    for (const f of shuffle(forms)) {
        const chip = el("div", { class: "chip", draggable: "true" });
        chip.textContent = f;
        enableDrag(chip);
        pool.appendChild(chip);
    }
}
function fillLabels(verb, tempus, modus, diathese) {
    $("lemma").textContent = verb.lemma;
    $("lab-tempus").textContent = tempus;
    $("lab-modus").textContent = modus;
    $("lab-diathese").textContent = diathese;
    $("errors").textContent = String(ERRORS);
    $("hint").textContent = "";
    $("feedback").innerHTML = "";
}
function allPlaced() {
    if (!CUR)
        return false;
    const expected = CUR.cells.length;
    const placed = Array.from($("grid").querySelectorAll("td.dropcell.ok")).length;
    return placed >= expected;
}
/* ---------- Drag & Drop ---------- */
function enableDrag(node) {
    node.addEventListener("dragstart", (ev) => {
        var _a;
        node.classList.add("dragging");
        (_a = ev.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData("text/plain", node.textContent || "");
        ev.dataTransfer.effectAllowed = "move";
    });
    node.addEventListener("dragend", () => node.classList.remove("dragging"));
}
function enableDrop(cell) {
    cell.addEventListener("dragover", (ev) => {
        ev.preventDefault();
        cell.classList.add("droptarget");
        ev.dataTransfer.dropEffect = "move";
    });
    cell.addEventListener("dragleave", () => cell.classList.remove("droptarget"));
    cell.addEventListener("drop", (ev) => {
        var _a;
        ev.preventDefault();
        cell.classList.remove("droptarget");
        if (!CUR)
            return;
        if (cell.classList.contains("ok"))
            return; // schon korrekt gefüllt
        const p = cell.getAttribute("data-p");
        const n = cell.getAttribute("data-n");
        const expected = CUR.tbl[p][n];
        const dropped = (((_a = ev.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData("text/plain")) || "").trim();
        const ok = normalizeGreek(dropped) === normalizeGreek(expected);
        const dragging = document.querySelector(".chip.dragging");
        if (ok) {
            cell.textContent = dropped;
            cell.classList.remove("bad");
            cell.classList.add("ok");
            if (dragging && dragging.parentElement)
                dragging.parentElement.removeChild(dragging);
            if (allPlaced()) {
                $("feedback").innerHTML = `<span class="ok">✓ Alles korrekt zugeordnet!</span>`;
            }
        }
        else {
            cell.classList.remove("ok");
            cell.classList.add("bad");
            ERRORS++;
            $("errors").textContent = String(ERRORS);
            setTimeout(() => cell.classList.remove("bad"), 350);
        }
    });
}
/* ---------- Normalisierung (minimal) ---------- */
function normalizeGreek(s) {
    // Entfernt Diakritika, vereinheitlicht Whitespace (nicht zu aggressiv)
    return s
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}
/* ---------- Task ---------- */
async function newTask() {
    if (VERBEN.length === 0 || ENDS.length === 0)
        return;
    const verb = pick(VERBEN);
    const tempus = "praesens"; // aktuell nur Präsens
    const modus = pick(MODI);
    const diath = "aktiv";
    const tbl = buildGreekForms(verb, tempus, modus, diath, ENDS);
    // Sammle alle existierenden Zellen (keine "—")
    const showPersons = modus === "imperativ" ? ["2", "3"] : ["1", "2", "3"];
    const cells = [];
    for (const p of showPersons) {
        for (const n of NUMERI) {
            const f = tbl[p][n];
            if (f && f !== "—")
                cells.push({ p, n, form: f });
        }
    }
    if (cells.length === 0)
        return newTask(); // Sicherheitsnetz
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
        if (!CUR)
            return;
        $("pool").innerHTML = "";
        // Alle Zellen füllen
        const tds = Array.from($("grid").querySelectorAll("td.dropcell"));
        for (const cell of tds) {
            const p = cell.getAttribute("data-p");
            const n = cell.getAttribute("data-n");
            const val = CUR.tbl[p][n];
            if (!val || val === "—")
                continue;
            cell.textContent = val;
            cell.classList.add("ok");
            cell.classList.remove("bad");
        }
        $("feedback").innerHTML = `<span class="muted">Lösung eingetragen.</span>`;
    });
    await newTask();
})();
