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
function optionize(sel, values) {
    sel.innerHTML = values.map(v => `<option value="${v}">${v}</option>`).join("");
}
function renderTable(host, tbl, modus) {
    const showPersons = modus === "imperativ" ? ["2", "3"] : ["1", "2", "3"];
    const usedNumeri = NUMERI.filter(nu => showPersons.some(p => tbl[p][nu] !== "—"));
    const thead = `<thead><tr><th></th>${usedNumeri.map(n => `<th>${n.toUpperCase()}</th>`).join("")}</tr></thead>`;
    const rows = showPersons.map(p => `<tr><th>${p}. Person</th>${usedNumeri.map(n => `<td>${tbl[p][n]}</td>`).join("")}</tr>`).join("");
    host.innerHTML = `<table class="konjtbl">${thead}<tbody>${rows}</tbody></table>`;
}
(async function init() {
    const [verbs, ends] = await Promise.all([loadGreekVerbsCsv(), loadGreekEndingsCsv()]);
    const selVerb = $("sel-verb");
    const selTempus = $("sel-tempus");
    const selModus = $("sel-modus");
    const selDiath = $("sel-diathese");
    const hostTbl = $("tbl");
    // Dropdowns – Verb nur Lemma
    optionize(selVerb, verbs.map(v => v.lemma));
    optionize(selTempus, TEMPI);
    optionize(selModus, MODI);
    optionize(selDiath, DIATHESEN);
    const build = () => {
        const v = verbs[selVerb.selectedIndex];
        const tempus = selTempus.value;
        const modus = selModus.value;
        const diath = selDiath.value;
        const tbl = buildGreekForms(v, tempus, modus, diath, ends);
        renderTable(hostTbl, tbl, modus);
    };
    $("btn-build").addEventListener("click", build);
    build(); // Default
})();
