// src/tables.ts
import { ladeCsvDatei } from "./utils/csv-loader.js";
import { ladeSubstantive } from "./utils/substantive-loader.js";
import { bildeFormenDyn, KASUS_ORDER } from "./utils/morpho.js";
import { buildEndungenIndex, keyOf } from "./utils/endung-index.js";
import { Deklination, Deklinationen, Genus, Numerus } from "./models/models.js";
async function ladeAlleDekl() {
    const csv = await ladeCsvDatei("assets/data/deklinationen.csv");
    if (csv.length === 0)
        return [];
    const header = csv[0];
    const idx = {
        Deklination: header.indexOf("Deklination"),
        Kasus: header.indexOf("Kasus"),
        Genus: header.indexOf("Genus"),
        Numerus: header.indexOf("Numerus"),
        Endung: header.indexOf("Endung"),
    };
    for (const [k, v] of Object.entries(idx))
        if (v === -1)
            throw new Error(`CSV-Header fehlt Spalte: ${k}`);
    const parseDek = (v) => v.trim();
    const parseGen = (v) => v.trim();
    const parseNum = (v) => v.trim();
    const parseKas = (v) => v.trim();
    return csv.slice(1).map(r => new Deklination(parseDek(r[idx.Deklination]), parseKas(r[idx.Kasus]), parseGen(r[idx.Genus]), parseNum(r[idx.Numerus]), r[idx.Endung].trim()));
}
function renderEndungsTabelle(title, tbl) {
    const card = document.createElement("div");
    card.className = "card";
    const h2 = document.createElement("h2");
    h2.textContent = title;
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const trH = document.createElement("tr");
    trH.appendChild(document.createElement("th"));
    ["Sg", "Pl"].forEach(lbl => {
        const th = document.createElement("th");
        th.textContent = lbl;
        trH.appendChild(th);
    });
    thead.appendChild(trH);
    const tbody = document.createElement("tbody");
    for (const k of KASUS_ORDER) {
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        th.textContent = k;
        tr.appendChild(th);
        const tdSg = document.createElement("td");
        tdSg.textContent = tbl[k][Numerus.Sg] || "—";
        const tdPl = document.createElement("td");
        tdPl.textContent = tbl[k][Numerus.Pl] || "—";
        tr.appendChild(tdSg);
        tr.appendChild(tdPl);
        tbody.appendChild(tr);
    }
    table.appendChild(thead);
    table.appendChild(tbody);
    // 👉 Hover nur für Endungstabelle
    attachHoverHighlight(table);
    card.appendChild(h2);
    card.appendChild(table);
    return card;
}
function renderBeispielCard(substPick, endIdx) {
    const card = document.createElement("div");
    card.className = "card";
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Zeige Beispiel";
    const panel = document.createElement("div");
    btn.addEventListener("click", () => {
        const s = substPick();
        if (!s) {
            panel.innerHTML = "<p class='muted'>Keine passenden Substantive gefunden.</p>";
            return;
        }
        // Formen mit dynamischen Endungen
        const formen = bildeFormenDyn(s, endIdx);
        // render Tabelle
        const title = document.createElement("h3");
        title.textContent = `Beispiel: ${s.nomSg} (${s.dekl}, ${s.genus})`;
        const t = document.createElement("table");
        const thead = document.createElement("thead");
        const trH = document.createElement("tr");
        trH.appendChild(document.createElement("th"));
        ["Sg", "Pl"].forEach(lbl => { const th = document.createElement("th"); th.textContent = lbl; trH.appendChild(th); });
        thead.appendChild(trH);
        const tbody = document.createElement("tbody");
        for (const k of KASUS_ORDER) {
            const tr = document.createElement("tr");
            const th = document.createElement("th");
            th.textContent = k;
            tr.appendChild(th);
            const tdSg = document.createElement("td");
            tdSg.textContent = formen[k][Numerus.Sg];
            const tdPl = document.createElement("td");
            tdPl.textContent = formen[k][Numerus.Pl];
            tr.appendChild(tdSg);
            tr.appendChild(tdPl);
            tbody.appendChild(tr);
        }
        t.appendChild(thead);
        t.appendChild(tbody);
        panel.innerHTML = "";
        panel.appendChild(title);
        panel.appendChild(t);
    });
    card.appendChild(btn);
    card.appendChild(panel);
    return card;
}
// Hover-Delegation NUR für Endungstabellen
function attachHoverHighlight(table) {
    const norm = (s) => (s !== null && s !== void 0 ? s : "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    const getCells = () => Array.from(table.querySelectorAll("tbody td"));
    const clear = () => getCells().forEach(td => td.classList.remove("match-hover"));
    table.addEventListener("mouseover", (ev) => {
        const td = ev.target.closest("td");
        if (!td || !table.contains(td))
            return;
        const v = td.textContent || "";
        if (!v || norm(v) === "—")
            return;
        const needle = norm(v);
        clear();
        for (const cell of getCells()) {
            if (norm(cell.textContent || "") === needle)
                cell.classList.add("match-hover");
        }
    });
    table.addEventListener("mouseout", (ev) => {
        const related = ev.relatedTarget;
        if (!related || !related.closest || !related.closest("td") || !table.contains(related.closest("td"))) {
            clear();
        }
    });
}
(async () => {
    const root = document.getElementById("tables-root");
    try {
        const [alleEndungenRows, alleSubst] = await Promise.all([ladeAlleDekl(), ladeSubstantive()]);
        const endIdx = buildEndungenIndex(alleEndungenRows);
        // Gruppen (Titel + Filter + Substantiv-Filter)
        const gruppen = [
            { title: "a-Deklination (f)", dekl: Deklinationen.A, genus: Genus.F, substFilter: s => s.dekl === Deklinationen.A && s.genus === Genus.F },
            { title: "o-Deklination (m)", dekl: Deklinationen.O, genus: Genus.M, substFilter: s => s.dekl === Deklinationen.O && s.genus === Genus.M },
            { title: "o-Deklination (n)", dekl: Deklinationen.O, genus: Genus.N, substFilter: s => s.dekl === Deklinationen.O && s.genus === Genus.N },
            { title: "3. Deklination (m) – Normalfall", dekl: Deklinationen.Dritte, genus: Genus.M, substFilter: s => s.dekl === Deklinationen.Dritte && s.genus === Genus.M },
            { title: "3. Deklination (n) – Normalfall", dekl: Deklinationen.Dritte, genus: Genus.N, substFilter: s => s.dekl === Deklinationen.Dritte && s.genus === Genus.N },
        ];
        root.innerHTML = "";
        for (const g of gruppen) {
            const block = document.createElement("section");
            const row = document.createElement("div");
            row.className = "two-col";
            // Linke Karte: Endungen-Tabelle (aus Index)
            const key = keyOf(g.dekl, g.genus);
            const tbl = endIdx.get(key);
            if (!tbl)
                continue; // falls (noch) keine Endungen vorhanden
            const leftCard = renderEndungsTabelle(g.title, tbl);
            // Rechte Karte: Button + Beispiel (random passendes Substantiv)
            const candidates = alleSubst.filter(g.substFilter);
            const pick = () => (candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null);
            const rightCard = renderBeispielCard(pick, endIdx);
            row.appendChild(leftCard);
            row.appendChild(rightCard);
            block.appendChild(row);
            root.appendChild(block);
        }
    }
    catch (e) {
        console.error(e);
        root.textContent = `Fehler beim Laden: ${e.message}`;
    }
})();
