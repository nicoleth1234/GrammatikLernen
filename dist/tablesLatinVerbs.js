import { ladeEndungen, ladeVerben, ladeIrreg, ladeIrregAlsVerben } from "./utils/la-verb-loader.js";
import { buildEndungsIndex, buildIrregIndex, buildForms } from "./utils/la-verb-forms.js";
const el = {
    verbSelect: document.getElementById("verbSelect"),
    verbSearch: document.getElementById("verbSearch"),
    modus: document.getElementById("modus"),
    tempus: document.getElementById("tempus"),
    diathese: document.getElementById("diathese"),
    add: document.getElementById("addTable"),
    tables: document.getElementById("tables"),
};
const tSel = el.tempus; // HTMLSelectElement
tSel.innerHTML = [
    "Praesens",
    "Imperfekt",
    "Perfekt",
    "Plusquamperfekt",
].map(t => `<option value="${t}">${t}</option>`).join("");
let VERBEN = [];
let END_IDX;
let IRR_IDX;
function fillVerbSelect(verbs) {
    const html = verbs
        .map(v => `<option value="${v.infinitiv}">${v.infinitiv}</option>`)
        .join("");
    el.verbSelect.innerHTML = html;
}
function filterVerbs(q) {
    const s = q.trim().toLowerCase();
    return VERBEN.filter(v => v.infinitiv.toLowerCase().includes(s) ||
        v.lemma.toLowerCase().includes(s));
}
function applySearch() {
    const q = el.verbSearch.value.trim().toLowerCase();
    const filtered = q ? filterVerbs(q) : VERBEN;
    fillVerbSelect(filtered);
}
function renderTableCard(verb, modus, tempus, diathese) {
    const forms = buildForms(verb, END_IDX, IRR_IDX, tempus, modus, diathese);
    const card = document.createElement("div");
    card.className = "card";
    const h3 = document.createElement("h3");
    h3.textContent = `${verb.lemma} — ${tempus} ${modus} ${diathese}`;
    const del = document.createElement("button");
    del.className = "btn-icon";
    del.textContent = "×";
    del.title = "Tabelle schliessen";
    del.style.float = "right";
    del.addEventListener("click", () => card.remove());
    const table = document.createElement("table");
    table.className = "endings-table verb-table";
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    trh.innerHTML = "<th></th><th>Sg</th><th>Pl</th>";
    thead.appendChild(trh);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    const persons = modus === "Imperativ" ? ["2"] : ["1", "2", "3"];
    const rows = modus === "Imperativ" ? ["2. Pers."] : ["1. Pers.", "2. Pers.", "3. Pers."];
    for (let i = 0; i < persons.length; i++) {
        const p = persons[i];
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        th.textContent = rows[i];
        tr.appendChild(th);
        const tdSg = document.createElement("td");
        const tdPl = document.createElement("td");
        tdSg.textContent = forms[p]["Sg"];
        tdPl.textContent = forms[p]["Pl"];
        tr.appendChild(tdSg);
        tr.appendChild(tdPl);
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    card.appendChild(h3);
    card.appendChild(del);
    card.appendChild(table);
    el.tables.appendChild(card);
}
el.verbSearch.addEventListener("input", applySearch);
el.add.addEventListener("click", () => {
    const selectedVerb = el.verbSelect.value;
    const verb = VERBEN.find(v => v.infinitiv === selectedVerb);
    if (!verb)
        return;
    const modus = el.modus.value;
    const tempus = el.tempus.value;
    const diathese = el.diathese.value;
    renderTableCard(verb, modus, tempus, diathese);
});
(async function init() {
    const [endungen, verben, irregRows, irregVerben] = await Promise.all([
        ladeEndungen(),
        ladeVerben(),
        ladeIrreg(),
        ladeIrregAlsVerben()
    ]);
    END_IDX = buildEndungsIndex(endungen);
    IRR_IDX = buildIrregIndex(irregRows);
    // merge ohne Duplikate (falls Lemma schon regulär vorhanden ist)
    const known = new Set(verben.map(v => v.lemma));
    const irregFiltered = irregVerben.filter((item => {
        const seen = new Set();
        return (currentItem) => {
            if (seen.has(currentItem.infinitiv)) {
                return false;
            }
            seen.add(currentItem.infinitiv);
            return true;
        };
    })());
    const merged = verben.concat(irregFiltered.filter(v => !known.has(v.lemma)));
    VERBEN = merged;
    fillVerbSelect(VERBEN);
})();
