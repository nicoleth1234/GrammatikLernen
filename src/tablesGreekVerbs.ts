import {
    loadGreekEndingsCsv,
    loadGreekVerbsCsv,
    buildGreekForms,
    PERSONEN,
    NUMERI,
    type GrVerb, type EndingRow, type Person, type Numerus,
} from "./utils/greek-verb-forms.js";

type FormsTable = Record<Person, Record<Numerus, string>>;

type Tempus = "praesens";            // UI-Engrenzung: vorerst nur Präsens
type Modus = "indikativ" | "imperativ";
type Diathese = "aktiv";             // vorerst nur aktiv

const TEMPI: ReadonlyArray<Tempus> = ["praesens"];
const MODI: ReadonlyArray<Modus> = ["indikativ","imperativ"];
const DIATHESEN: ReadonlyArray<Diathese> = ["aktiv"];

function $(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`#${id} nicht gefunden`);
    return el;
}
function optionize(sel: HTMLSelectElement, values: ReadonlyArray<string>) {
    sel.innerHTML = values.map(v => `<option value="${v}">${v}</option>`).join("");
}

function renderTable(host: HTMLElement, tbl: FormsTable, modus: Modus) {
    const showPersons: ReadonlyArray<Person> = modus === "imperativ" ? (["2","3"] as const) : (["1","2","3"] as const);
    const usedNumeri = NUMERI.filter(nu => showPersons.some(p => tbl[p][nu] !== "—"));
    const thead = `<thead><tr><th></th>${usedNumeri.map(n => `<th>${n.toUpperCase()}</th>`).join("")}</tr></thead>`;
    const rows = showPersons.map(p =>
        `<tr><th>${p}. Person</th>${usedNumeri.map(n => `<td>${tbl[p][n]}</td>`).join("")}</tr>`
    ).join("");
    host.innerHTML = `<table class="konjtbl">${thead}<tbody>${rows}</tbody></table>`;
}

(async function init() {
    const [verbs, ends] = await Promise.all([loadGreekVerbsCsv(), loadGreekEndingsCsv()]);

    const selVerb = $("sel-verb") as HTMLSelectElement;
    const selTempus = $("sel-tempus") as HTMLSelectElement;
    const selModus = $("sel-modus") as HTMLSelectElement;
    const selDiath = $("sel-diathese") as HTMLSelectElement;
    const hostTbl = $("tbl");
    hostTbl.className = "endings-table";

    // Dropdowns – Verb nur Lemma
    optionize(selVerb, verbs.map(v => v.lemma));
    optionize(selTempus, TEMPI);
    optionize(selModus, MODI);
    optionize(selDiath, DIATHESEN);

    const build = () => {
        const v: GrVerb = verbs[selVerb.selectedIndex];
        const tempus = selTempus.value as Tempus;
        const modus = selModus.value as Modus;
        const diath = selDiath.value as Diathese;

        const tbl = buildGreekForms(v, tempus, modus, diath, ends as ReadonlyArray<EndingRow>);
        renderTable(hostTbl, tbl, modus);
    };

    $("btn-build").addEventListener("click", build);
    build(); // Default
})();
