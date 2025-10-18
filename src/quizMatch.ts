import { ladeSubstantive, Substantiv } from "./utils/substantive-loader.js";
import { ladeCsvDatei } from "./utils/csv-loader.js";
import { buildEndungenIndex, keyOf } from "./utils/endung-index.js";
import { bildeFormenDyn, KASUS_ORDER } from "./utils/morpho.js";
import { Kasus, Numerus, Deklinationen, Genus } from "./models/models.js";

const gridBody = document.getElementById("grid-body")!;
const poolEl = document.getElementById("pool")!;
const metaEl = document.getElementById("meta")!;
const btnNext = document.getElementById("btn-next") as HTMLButtonElement;
const btnReset = document.getElementById("btn-reset") as HTMLButtonElement;
const barEl = document.getElementById("progress-bar") as HTMLDivElement;
const pctEl = document.getElementById("progress-text")!;
const timerEl = document.getElementById("timer")!;
const congratsEl = document.getElementById("congrats")!;

// --- Optionen aus URL ---
const params = new URLSearchParams(location.search);
const withVoc = (params.get("voc") ?? "on") === "on";
const mode = (params.get("mode") ?? "normal") as "normal" | "hard";

// Zeilenwahl je nach Vokativ-Flag
const ROWS: Kasus[] = withVoc ? KASUS_ORDER : [Kasus.Nom, Kasus.Gen, Kasus.Dat, Kasus.Akk, Kasus.Abl];

// --- Helpers ---
function norm(s: string) {
    return (s || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle<T>(arr: T[]) { for (let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }

// --- State ---
type CellKey = `${Kasus}|${Numerus}`;
type FormenMap = Map<CellKey, string>;
let endIdx: ReturnType<typeof buildEndungenIndex>;
let substantive: Substantiv[] = [];
let currentSubst: Substantiv | null = null;
let targetMap: FormenMap = new Map();
let filledSet = new Set<CellKey>();

// Timer
let timerId: number | null = null;
let startTs = 0;
function startTimer() {
    if (timerId) clearInterval(timerId);
    startTs = Date.now();
    timerId = window.setInterval(() => {
        const sec = Math.floor((Date.now() - startTs)/1000);
        const mm = String(Math.floor(sec/60)).padStart(2,"0");
        const ss = String(sec%60).padStart(2,"0");
        timerEl.textContent = `${mm}:${ss}`;
    }, 250);
}
function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
}

// Progress
const TOTAL_CELLS = ROWS.length * 2; // Sg+Pl
function setProgress() {
    const pct = Math.round((filledSet.size / TOTAL_CELLS) * 100);
    barEl.style.width = `${pct}%`;
    pctEl.textContent = `${pct}%`;
    if (pct === 100) {
        stopTimer();
        congratsEl.classList.add("show");
    } else {
        congratsEl.classList.remove("show");
    }
}

// UI-Bau
function buildGridSkeleton() {
    gridBody.innerHTML = "";
    filledSet.clear();
    setProgress();

    for (const k of ROWS) {
        const tr = document.createElement("tr");
        const th = document.createElement("th"); th.textContent = k; tr.appendChild(th);

        for (const n of [Numerus.Sg, Numerus.Pl] as const) {
            const td = document.createElement("td");
            td.classList.add("drop-target");
            td.dataset.kasus = k;
            td.dataset.numerus = n;
            td.addEventListener("dragover", (ev) => { ev.preventDefault(); td.classList.add("drop-ok"); });
            td.addEventListener("dragleave", () => td.classList.remove("drop-ok"));
            td.addEventListener("drop", (ev) => onDropCell(ev, td));
            tr.appendChild(td);
        }
        gridBody.appendChild(tr);
    }
}

function buildCards(forms: string[]) {
    poolEl.innerHTML = "";
    const list = shuffle(forms.map((text, i) => ({ id: `c${i}`, text })));

    for (const c of list) {
        const chip = document.createElement("div");
        chip.className = "card-chip";
        chip.textContent = c.text;
        chip.draggable = true;
        chip.id = c.id;
        chip.dataset.value = c.text;
        chip.addEventListener("dragstart", (ev) => {
            ev.dataTransfer?.setData("text/plain", c.text);
            ev.dataTransfer!.effectAllowed = "move";
        });
        poolEl.appendChild(chip);
    }
}

function onDropCell(ev: DragEvent, td: HTMLTableCellElement) {
    ev.preventDefault();
    td.classList.remove("drop-ok", "drop-bad", "shake");

    const dropped = (ev.dataTransfer?.getData("text/plain") || "").trim();
    if (!dropped) return;

    const key = `${td.dataset.kasus}|${td.dataset.numerus}` as CellKey;
    const expected = targetMap.get(key) || "";
    const ok = norm(dropped) === norm(expected);

    if (!ok) {
        td.classList.add("drop-bad","shake");
        setTimeout(() => td.classList.remove("drop-bad","shake"), 450);
        return;
    }

    // korrekt: nur wenn Feld noch leer ist, zählen & darstellen
    if (!td.classList.contains("filled")) {
        td.textContent = dropped;
        td.classList.add("filled");
        filledSet.add(key);
        setProgress();

        if (mode === "normal") {
            // genau EINE passende Karte entfernen (bei Duplikaten bleiben die anderen)
            const card = Array.from(poolEl.children).find(el => norm((el as HTMLElement).dataset.value || "") === norm(dropped));
            if (card) card.remove();
        } else {
            // hard: Karte bleibt bestehen (kein Ausschlussverfahren)
            // nichts entfernen
        }
    }
}

// Meta (unter Titel-Tabelle)
function setMeta(subst: Substantiv) {
    if (mode === "hard") {
        metaEl.textContent = ""; // kein Meta im Hard-Mode
    } else {
        metaEl.textContent = `${subst.dekl}-Deklination, ${subst.genus}`;
    }
}

function startRound() {
    const candidates = substantive.filter(s => endIdx.has(keyOf(s.dekl, s.genus)));
    currentSubst = pick(candidates);
    if (!currentSubst) {
        metaEl.textContent = "Keine Substantive gefunden.";
        return;
    }
    const tbl = bildeFormenDyn(currentSubst, endIdx);

    // Zielmatrix vorbereiten + Kartenpool füllen
    targetMap = new Map();
    let pool: string[] = [];
    for (const k of ROWS) {
        for (const n of [Numerus.Sg, Numerus.Pl] as const) {
            const f = tbl[k][n];
            targetMap.set(`${k}|${n}`, f);
            pool.push(f);
        }
    }

    if (mode === "hard") {
        // nur UNIQUE Formen anzeigen
        pool = Array.from(new Set(pool.map(norm))).map(nv => {
            // re-map zurück zu einer sichtbaren Form (erstes Match)
            return pool.find(x => norm(x) === nv)!;
        });
    }

    buildGridSkeleton();
    buildCards(pool);
    setMeta(currentSubst);
    setProgress();
    congratsEl.classList.remove("show");
    startTimer();
}

btnNext.addEventListener("click", startRound);
btnReset.addEventListener("click", () => {
    if (!currentSubst) return;
    buildGridSkeleton();
    // Karten neu aus targetMap-Werten (normal = duplikate; hard = unique)
    let forms = Array.from(targetMap.values());
    if (mode === "hard") {
        forms = Array.from(new Set(forms.map(norm))).map(nv => forms.find(x => norm(x) === nv)!);
    }
    buildCards(forms);
    setProgress();
});

async function init() {
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
    substantive = subst.filter(s => endIdx.has(keyOf(s.dekl, s.genus)));

    startRound();
}

init();
