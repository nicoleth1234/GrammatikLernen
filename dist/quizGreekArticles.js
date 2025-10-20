// src/quizGreekArticles.ts
import { GR_ARTICLES, GR_KASUS_ORDER } from "./constants/gr-articles.js";
import { Genus, Numerus } from "./models/models.js";
// type Kasus = "Nom."|"Gen."|"Dat."|"Akk.";
// type Numerus = "Sg"|"Pl";
// type Genus = "m"|"f"|"n";
const gridBody = document.getElementById("grid-body");
const poolEl = document.getElementById("pool");
const barEl = document.getElementById("progress-bar");
const errEl = document.getElementById("errors");
const congratsEl = document.getElementById("congrats");
const btnReset = document.getElementById("btn-reset");
// Helper: garantiert korrektes Key-Format
const makeKey = (k, g, n) => `${k}|${g}|${n}`;
// ...
// Spalten-Definition bleibt gleich, aber mit zentralen Typen:
const COLS = [
    { genus: Genus.M, num: Numerus.Sg, label: "m Sg" },
    { genus: Genus.M, num: Numerus.Pl, label: "m Pl" },
    { genus: Genus.F, num: Numerus.Sg, label: "f Sg" },
    { genus: Genus.F, num: Numerus.Pl, label: "f Pl" },
    { genus: Genus.N, num: Numerus.Sg, label: "n Sg" },
    { genus: Genus.N, num: Numerus.Pl, label: "n Pl" },
];
let expectedMap = new Map();
let filled = new Set();
let errors = 0;
const TOTAL = GR_KASUS_ORDER.length * COLS.length;
function normalize(s) {
    return (s || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function setProgress() {
    const pct = Math.round((filled.size / TOTAL) * 100);
    barEl.style.width = `${pct}%`;
    if (pct === 100) {
        congratsEl.classList.add("show");
    }
    else {
        congratsEl.classList.remove("show");
    }
}
function buildGrid() {
    gridBody.innerHTML = "";
    expectedMap.clear();
    filled.clear();
    errors = 0;
    errEl.textContent = "0";
    setProgress();
    for (const k of GR_KASUS_ORDER) {
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        th.textContent = k;
        tr.appendChild(th);
        for (const c of COLS) {
            const td = document.createElement("td");
            td.className = "drop-target";
            td.dataset.kasus = k;
            td.dataset.genus = c.genus;
            td.dataset.numerus = c.num;
            // expected
            const form = GR_ARTICLES[c.genus][k][c.num];
            expectedMap.set(makeKey(k, c.genus, c.num), form);
            td.addEventListener("dragover", ev => { ev.preventDefault(); td.classList.add("drop-ok"); });
            td.addEventListener("dragleave", () => td.classList.remove("drop-ok"));
            td.addEventListener("drop", ev => onDropCell(ev, td));
            tr.appendChild(td);
        }
        gridBody.appendChild(tr);
    }
}
function buildPool() {
    poolEl.innerHTML = "";
    // Ein Chip pro Zelle (inkl. Duplikate wie τοῦ)
    const cards = [];
    let i = 0;
    for (const k of GR_KASUS_ORDER) {
        for (const c of COLS) {
            const txt = GR_ARTICLES[c.genus][k][c.num];
            cards.push({ text: txt, id: `card-${i++}` });
        }
    }
    // mischen
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    // rendern
    for (const card of cards) {
        const div = document.createElement("div");
        div.className = "chip";
        div.textContent = card.text;
        div.id = card.id;
        div.draggable = true;
        div.dataset.value = card.text;
        div.addEventListener("dragstart", ev => {
            var _a;
            (_a = ev.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData("text/plain", card.text);
            ev.dataTransfer.effectAllowed = "move";
        });
        poolEl.appendChild(div);
    }
}
function onDropCell(ev, td) {
    var _a;
    ev.preventDefault();
    td.classList.remove("drop-ok", "drop-bad", "shake");
    const dropped = (((_a = ev.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData("text/plain")) || "").trim();
    if (!dropped)
        return;
    // Hole Datensätze und baue den streng typisierten Key
    const k = td.dataset.kasus;
    const g = td.dataset.genus;
    const n = td.dataset.numerus;
    const key = makeKey(k, g, n);
    const expected = expectedMap.get(key) || "";
    if (normalize(dropped) !== normalize(expected)) {
        td.classList.add("drop-bad", "shake");
        errors += 1;
        errEl.textContent = String(errors);
        setTimeout(() => td.classList.remove("drop-bad", "shake"), 450);
        return;
    }
    // korrekt
    if (!td.classList.contains("filled")) {
        td.textContent = expected;
        td.classList.add("filled");
        filled.add(key);
        // genau eine passende Karte entfernen
        const card = Array.from(poolEl.children).find(el => normalize(el.dataset.value || "") === normalize(dropped));
        if (card)
            card.remove();
        setProgress();
    }
}
btnReset.addEventListener("click", () => {
    buildGrid();
    buildPool();
});
(function init() {
    buildGrid();
    buildPool();
    setProgress();
})();
