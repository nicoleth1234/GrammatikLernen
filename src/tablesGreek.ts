// src/tablesGreek.ts
import { ladeCsvDatei } from "./utils/csv-loader.js";
import { Kasus, Numerus } from "./models/models.js";
import { buildGrEndungenIndex, keyOfGr, KASUS_DE_ORDER, type GrEndRow, type GrEndTbl } from "./utils/gr-endungen-index.js";

// CSV lesen und in GrEndRow mappen
async function ladeGrEndungen(): Promise<GrEndRow[]> {
    const csv = await ladeCsvDatei("assets/data/gr_deklinationen.csv");
    if (csv.length === 0) return [];

    const header = csv[0];
    const idx = {
        Deklination: header.indexOf("Deklination"),
        Typ: header.indexOf("Typ"),
        Kasus: header.indexOf("Kasus"),
        Genus: header.indexOf("Genus"),
        Numerus: header.indexOf("Numerus"),
        Endung: header.indexOf("Endung"),
    };
    for (const [k, v] of Object.entries(idx)) if (v === -1) throw new Error(`CSV-Header fehlt Spalte: ${k}`);

    const parseKas = (v: string) => v.trim() as Kasus;
    const parseNum = (v: string) => v.trim() as Numerus;

    return csv.slice(1).map(r => ({
        deklination: r[idx.Deklination].trim(),
        typ: r[idx.Typ].trim(),
        genus: r[idx.Genus].trim() as "f" | "m" | "n",
        kasus: parseKas(r[idx.Kasus]),
        numerus: parseNum(r[idx.Numerus]),
        endung: r[idx.Endung].trim(),
    }));
}

// function attachHoverHighlight(table: HTMLTableElement) {
//     const norm = (s: string) =>
//         (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
//
//     const cells = () => Array.from(table.querySelectorAll<HTMLTableCellElement>("tbody td"));
//     const clear = () => cells().forEach(td => td.classList.remove("match-hover"));
//
//     table.addEventListener("mouseover", (ev) => {
//         const td = (ev.target as HTMLElement).closest("td");
//         if (!td || !table.contains(td)) return;
//         const v = td.textContent || "";
//         if (!v || norm(v) === "—") return;
//         const needle = norm(v);
//         clear();
//         for (const c of cells()) {
//             if (norm(c.textContent || "") === needle) c.classList.add("match-hover");
//         }
//     });
//     table.addEventListener("mouseout", (ev) => {
//         const rel = (ev as MouseEvent).relatedTarget as HTMLElement | null;
//         if (!rel || !rel.closest || !rel.closest("td") || !table.contains(rel.closest("td")!)) {
//             clear();
//         }
//     });
// }

// ...
function renderEndungsTabelle(title: string, tbl: GrEndTbl): HTMLDivElement {
    const card = document.createElement("div");
    card.className = "card";

    const h2 = document.createElement("h2");
    h2.textContent = title;

    const table = document.createElement("table");
    table.className = "endings-table"; // <— wichtig für globalen Hover
    // Kopf
    const thead = document.createElement("thead");
    const trH = document.createElement("tr");
    trH.appendChild(document.createElement("th"));
    ["Sg", "Pl"].forEach(lbl => {
        const th = document.createElement("th");
        th.textContent = lbl;
        trH.appendChild(th);
    });
    thead.appendChild(trH);
    // Körper (beachte KASUS_DE_ORDER OHNE Ablativ)
    const tbody = document.createElement("tbody");
    for (const k of KASUS_DE_ORDER) {
        const tr = document.createElement("tr");
        const th = document.createElement("th"); th.textContent = k; tr.appendChild(th);
        const tdSg = document.createElement("td"); tdSg.textContent = tbl[k]["Sg"] || "—";
        const tdPl = document.createElement("td"); tdPl.textContent = tbl[k]["Pl"] || "—";
        tr.appendChild(tdSg); tr.appendChild(tdPl);
        tbody.appendChild(tr);
    }
    table.appendChild(thead);
    table.appendChild(tbody);

    card.appendChild(h2);
    card.appendChild(table);
    return card;
}


(async () => {
    const root = document.getElementById("tables-root")!;
    try {
        const rows = await ladeGrEndungen();
        const endIdx = buildGrEndungenIndex(rows);

        root.innerHTML = "";

        // a-Deklination: Typen 1,2,3a,3b (alle f)
        const aTyps = ["1", "2", "3a", "3b"];
        for (const typ of aTyps) {
            const k = keyOfGr("a", typ, "f");
            const tbl = endIdx.get(k);
            if (!tbl) continue;
            root.appendChild(renderEndungsTabelle(`a-Deklination Typ ${typ} (f)`, tbl));
        }

        // o-Deklination: m, n (Typ = "-")
        for (const genus of ["m", "n"] as const) {
            const k = keyOfGr("o", "-", genus);
            const tbl = endIdx.get(k);
            if (!tbl) continue;
            root.appendChild(renderEndungsTabelle(`o-Deklination (${genus})`, tbl));
        }
    } catch (e) {
        console.error(e);
        root.textContent = `Fehler beim Laden: ${(e as Error).message}`;
    }
})();
