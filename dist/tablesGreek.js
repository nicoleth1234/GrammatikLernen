// src/tablesGreek.ts
import { ladeCsvDatei } from "./utils/csv-loader.js";
import { buildGrEndungenIndex, keyOfGr, KASUS_DE_ORDER } from "./utils/gr-endungen-index.js";
import { ladeGrSubstantive } from "./utils/gr-substantive-loader.js";
import { GR_ARTICLES } from "./constants/gr-articles.js";
function fuegeArtikelHinzu(formen, genus) {
    var _a;
    const artikel = GR_ARTICLES[genus];
    const mitArtikeln = {};
    for (const kasus of Object.keys(formen)) {
        mitArtikeln[kasus] = { Sg: "", Pl: "" };
        for (const num of ["Sg", "Pl"]) {
            const art = ((_a = artikel[kasus]) === null || _a === void 0 ? void 0 : _a[num]) || "";
            const wort = formen[kasus][num];
            // Bindestrich, falls kein Artikel (z. B. wenn kein Vokativ)
            mitArtikeln[kasus][num] = art ? `${art} ${wort}` : wort;
        }
    }
    return mitArtikeln;
}
function bildeFormen(stamm, endungen) {
    const formen = {};
    for (const kasus of Object.keys(endungen)) {
        formen[kasus] = { Sg: "", Pl: "" };
        for (const num of ["Sg", "Pl"]) {
            const end = endungen[kasus][num] || "";
            formen[kasus][num] = end === "—" ? "—" : stamm + end;
        }
    }
    return formen;
}
function renderBeispielTabelle(subst, tbl) {
    const card = document.createElement("div");
    card.className = "card example-card";
    const h2 = document.createElement("h2");
    h2.textContent = `Beispiel: ${subst.nomSg}`;
    card.appendChild(h2);
    const table = document.createElement("table");
    table.className = "endings-table";
    const thead = document.createElement("thead");
    const trH = document.createElement("tr");
    trH.innerHTML = "<th></th><th>Sg</th><th>Pl</th>";
    thead.appendChild(trH);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    for (const kasus of Object.keys(tbl)) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<th>${kasus}</th><td>${tbl[kasus].Sg}</td><td>${tbl[kasus].Pl}</td>`;
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    card.appendChild(table);
    return card;
}
// CSV lesen und in GrEndRow mappen
async function ladeGrEndungen() {
    const csv = await ladeCsvDatei("assets/data/gr_deklinationen.csv");
    if (csv.length === 0)
        return [];
    const header = csv[0];
    const idx = {
        Deklination: header.indexOf("Deklination"),
        Typ: header.indexOf("Typ"),
        Kasus: header.indexOf("Kasus"),
        Genus: header.indexOf("Genus"),
        Numerus: header.indexOf("Numerus"),
        Endung: header.indexOf("Endung"),
    };
    for (const [k, v] of Object.entries(idx))
        if (v === -1)
            throw new Error(`CSV-Header fehlt Spalte: ${k}`);
    const parseKas = (v) => v.trim();
    const parseNum = (v) => v.trim();
    return csv.slice(1).map(r => ({
        deklination: r[idx.Deklination].trim(),
        typ: r[idx.Typ].trim(),
        genus: r[idx.Genus].trim(),
        kasus: parseKas(r[idx.Kasus]),
        numerus: parseNum(r[idx.Numerus]),
        endung: r[idx.Endung].trim(),
    }));
}
// ...
function renderEndungsTabelle(title, tbl) {
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
        const th = document.createElement("th");
        th.textContent = k;
        tr.appendChild(th);
        const tdSg = document.createElement("td");
        tdSg.textContent = tbl[k]["Sg"] || "—";
        const tdPl = document.createElement("td");
        tdPl.textContent = tbl[k]["Pl"] || "—";
        tr.appendChild(tdSg);
        tr.appendChild(tdPl);
        tbody.appendChild(tr);
    }
    table.appendChild(thead);
    table.appendChild(tbody);
    card.appendChild(h2);
    card.appendChild(table);
    return card;
}
(async () => {
    const root = document.getElementById("tables-root");
    try {
        const rows = await ladeGrEndungen();
        const endIdx = buildGrEndungenIndex(rows);
        root.innerHTML = "";
        const subs = await ladeGrSubstantive();
        // a-Deklination
        const aTyps = ["1", "2", "3a", "3b"];
        for (const typ of aTyps) {
            const k = keyOfGr("a", typ, "f");
            const tbl = endIdx.get(k);
            if (!tbl)
                continue;
            const card = document.createElement("div");
            card.style.display = "flex";
            card.style.gap = "2rem";
            // Tabelle mit Endungen
            const endingsCard = renderEndungsTabelle(`a-Deklination Typ ${typ} (f)`, tbl);
            // Beispiel auswählen
            const sub = subs.find(s => s.deklination === "a" && s.typ === typ && s.genus === "f");
            if (sub) {
                let formen = bildeFormen(sub.stamm, tbl);
                formen = fuegeArtikelHinzu(formen, sub.genus);
                const beispielCard = renderBeispielTabelle(sub, formen);
                card.appendChild(endingsCard);
                card.appendChild(beispielCard);
            }
            else {
                card.appendChild(endingsCard);
            }
            root.appendChild(card);
        }
        // o-Deklination
        for (const genus of ["m", "n"]) {
            const k = keyOfGr("o", "-", genus);
            const tbl = endIdx.get(k);
            if (!tbl)
                continue;
            const card = document.createElement("div");
            card.style.display = "flex";
            card.style.gap = "2rem";
            const endingsCard = renderEndungsTabelle(`o-Deklination (${genus})`, tbl);
            const sub = subs.find(s => s.deklination === "o" && s.genus === genus);
            if (sub) {
                let formen = bildeFormen(sub.stamm, tbl);
                formen = fuegeArtikelHinzu(formen, sub.genus);
                const beispielCard = renderBeispielTabelle(sub, formen);
                card.appendChild(endingsCard);
                card.appendChild(beispielCard);
            }
            else {
                card.appendChild(endingsCard);
            }
            root.appendChild(card);
        }
    }
    catch (e) {
        console.error(e);
        root.textContent = `Fehler beim Laden: ${e.message}`;
    }
})();
