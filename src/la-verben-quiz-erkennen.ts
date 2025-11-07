import {
    ladeEndungen,
    ladeVerben,
    ladeIrreg,
    ladeIrregAlsVerben,
    type Tempus,
    type Modus,
    type Diathese,
    type Person,
    type Numerus,
    type VerbRow,
} from "./utils/la-verb-loader.js";
import { buildEndungsIndex, buildIrregIndex, buildForms } from "./utils/la-verb-forms.js";

const TEMPI: Tempus[] = ["Praesens", "Imperfekt", "Perfekt", "Plusquamperfekt"];
const MODI: Modus[] = ["Indikativ", "Imperativ"];
const DIATHESEN: Diathese[] = ["Aktiv", "Passiv"];
const PERSONEN: Person[] = ["1", "2", "3"];
const NUMERI: Numerus[] = ["Sg", "Pl"];

type Task = {
    infinitiv: string;
    tempus: Tempus;
    modus: Modus;
    diathese: Diathese;
    person: Person;
    numerus: Numerus;
    form: string;
};

function $(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} nicht gefunden`);
    return el;
}
function setOptions(sel: HTMLSelectElement, values: string[]) {
    sel.innerHTML = values.map(v => `<option value="${v}">${v}</option>`).join("");
}

function normLatin(s: string): string {
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

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

let END_IDX: ReturnType<typeof buildEndungsIndex>;
let IRR_IDX: ReturnType<typeof buildIrregIndex>;
let VERBEN: VerbRow[] = [];

let cur: Task | null = null;
let errors = 0;

async function nextTask() {
    const verb = pick(VERBEN);
    const tempus = pick(TEMPI);
    const modus = pick(MODI);
    const diathese = pick(DIATHESEN);

    const table = buildForms(verb, END_IDX, IRR_IDX, tempus, modus, diathese);

    const candidates: Array<{ p: Person; n: Numerus; form: string }> = [];
    for (const p of PERSONEN) {
        for (const n of NUMERI) {
            const f = table[p][n];
            if (f && f !== "—") candidates.push({ p, n, form: f });
        }
    }
    // Falls eine (gewählte) Kombination keine Formen liefert, erneut versuchen
    if (candidates.length === 0) return nextTask();

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
    ($("prompt") as HTMLDivElement).textContent = cur.form;
    ( $("inf") as HTMLInputElement ).value = "";
    ( $("tempus") as HTMLSelectElement ).value = "";
    ( $("modus") as HTMLSelectElement ).value = "";
    ( $("diathese") as HTMLSelectElement ).value = "";
    ( $("person") as HTMLSelectElement ).value = "";
    ( $("numerus") as HTMLSelectElement ).value = "";
    ($("#feedback") as HTMLDivElement).innerHTML = "";
}

function check() {
    if (!cur) return;
    const okInf = normLatin(( $("inf") as HTMLInputElement ).value) === normLatin(cur.infinitiv);
    const okTempus = ( $("tempus") as HTMLSelectElement ).value === cur.tempus;
    const okModus = ( $("modus") as HTMLSelectElement ).value === cur.modus;
    const okDiathese = ( $("diathese") as HTMLSelectElement ).value === cur.diathese;
    const okPerson = ( $("person") as HTMLSelectElement ).value === cur.person;
    const okNumerus = ( $("numerus") as HTMLSelectElement ).value === cur.numerus;

    const allOk = okInf && okTempus && okModus && okDiathese && okPerson && okNumerus;
    const fb = $("feedback") as HTMLDivElement;

    if (allOk) {
        fb.innerHTML = `<span class="ok">✓ Richtig!</span>`;
        setTimeout(() => { void nextTask(); }, 400);
    } else {
        errors++;
        ($("errors") as HTMLSpanElement).textContent = String(errors);
        const miss: string[] = [];
        if (!okInf) miss.push("Infinitiv");
        if (!okTempus) miss.push("Tempus");
        if (!okModus) miss.push("Modus");
        if (!okDiathese) miss.push("Diathese");
        if (!okPerson) miss.push("Person");
        if (!okNumerus) miss.push("Numerus");
        fb.innerHTML = `<span class="warn">✗ Nicht ganz. Prüfe: ${miss.join(", ")}</span>`;
    }
}

function showSolution() {
    if (!cur) return;
    const t = cur;
    const fb = $("feedback") as HTMLDivElement;
    fb.innerHTML = `<div class="muted">Lösung: ${t.infinitiv}; ${t.tempus}, ${t.modus}, ${t.diathese}; ${t.person}. ${t.numerus}</div>`;
}

(async function init() {
    // Dropdown-Optionen
    setOptions($("tempus") as HTMLSelectElement, ["", ...TEMPI]);
    setOptions($("modus") as HTMLSelectElement, ["", ...MODI]);
    setOptions($("diathese") as HTMLSelectElement, ["", ...DIATHESEN]);
    setOptions($("person") as HTMLSelectElement, ["", ...PERSONEN]);
    setOptions($("numerus") as HTMLSelectElement, ["", ...NUMERI]);

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
    ($("errors") as HTMLSpanElement).textContent = "0";

    // Events
    $("btn-submit").addEventListener("click", () => check());
    $("btn-next").addEventListener("click", () => { void nextTask(); });
    $("btn-show").addEventListener("click", () => showSolution());
    ( $("inf") as HTMLInputElement ).addEventListener("keydown", (e) => {
        if (e.key === "Enter") check();
    });

    await nextTask();
})();
