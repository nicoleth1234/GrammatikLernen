import { ladeCsvDatei } from "./utils/csv-loader.js";
import type { EndingRow, Numerus, Person } from "./utils/greek-verb-forms.js";
import { NUMERI, PERSONEN } from "./utils/greek-verb-forms.js";

type FormsTable = Record<Person, Record<Numerus, string>>;

function $(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`#${id} nicht gefunden`);
    return el;
}

function emptyTable(): FormsTable {
    return { "1": { sg: "—", pl: "—" }, "2": { sg: "—", pl: "—" }, "3": { sg: "—", pl: "—" } };
}

function parseEndungen(rows: string[][]): EndingRow[] {
    const h = rows[0].map(h => h.trim().toLowerCase());
    const I = (k: string) => h.indexOf(k);
    const out: EndingRow[] = [];
    for (const r of rows.slice(1)) {
        out.push({
            konjugation: r[I("konjugation")].trim() as EndingRow["konjugation"],
            tempus: r[I("tempus")].trim() as EndingRow["tempus"],
            modus: r[I("modus")].trim() as EndingRow["modus"],
            diathese: r[I("diathese")].trim() as EndingRow["diathese"],
            person: r[I("person")].trim() as Person,
            numerus: r[I("numerus")].trim().toLowerCase() as Numerus,
            endung: r[I("endung")].trim(),
        });
    }
    return out;
}

function renderTable(
    host: HTMLElement,
    tbl: FormsTable,
    showPersons: ReadonlyArray<Person>
) {
    const usedNumeri = NUMERI.filter((nu) =>
        showPersons.some((p) => tbl[p][nu] !== "—")
    );
    const thead = `<thead><tr><th></th>${usedNumeri.map(n => `<th>${n.toUpperCase()}</th>`).join("")}</tr></thead>`;
    const rows = showPersons.map(p =>
        `<tr><th>${p}. Person</th>${usedNumeri.map(n => `<td>${tbl[p][n]}</td>`).join("")}</tr>`
    ).join("");

    host.innerHTML = `<table class="konjtbl endings-table">${thead}<tbody>${rows}</tbody></table>`;
}

(async function init() {
    const raw = await ladeCsvDatei("assets/data/gr_verben_endungen.csv");
    const rows = parseEndungen(raw);

    // Indikativ Präsens Aktiv
    const indRows = rows.filter(r =>
        r.konjugation==="omega" && r.tempus==="praesens" && r.modus==="indikativ" && r.diathese==="aktiv"
    );
    const indTbl = emptyTable();
    for (const r of indRows) indTbl[r.person][r.numerus] = r.endung;
    renderTable($("tbl-ind-akt"), indTbl, PERSONEN);

    // Imperativ Präsens Aktiv – nur 2./3. Person
    const impRows = rows.filter(r =>
        r.konjugation==="omega" && r.tempus==="praesens" && r.modus==="imperativ" && r.diathese==="aktiv"
    );
    const impTbl = emptyTable();
    for (const r of impRows) impTbl[r.person][r.numerus] = r.endung;
    renderTable($("tbl-imp-akt"), impTbl, ["2","3"]);
})();
