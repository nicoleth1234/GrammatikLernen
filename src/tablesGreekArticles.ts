// src/tablesGreekArticles.ts
import { GR_ARTICLES, GR_KASUS_ORDER } from "./constants/gr-articles.js";

(function render() {
    const host = document.getElementById("table-wrap")!;
    const table = document.createElement("table");
    table.className = "endings-table"; // wichtig für globalen Hover

    // Kopf:   |  m Sg | m Pl | f Sg | f Pl | n Sg | n Pl
    const thead = document.createElement("thead");
    const trH = document.createElement("tr");
    trH.appendChild(document.createElement("th")); // leere Ecke
    const headerCells = ["Singular m", "Plural m", "Singular f", "Plural f", "Singular n", "Plural n"];
    for (const h of headerCells) {
        const th = document.createElement("th");
        th.textContent = h;
        trH.appendChild(th);
    }
    thead.appendChild(trH);

    // Körper: Zeilen = Kasus (Nom./Gen./Dat./Akk.)
    const tbody = document.createElement("tbody");
    for (const k of GR_KASUS_ORDER) {
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        th.textContent = k;
        tr.appendChild(th);

        // m Sg/Pl
        tr.appendChild(td(GR_ARTICLES.m[k].Sg));
        tr.appendChild(td(GR_ARTICLES.m[k].Pl));
        // f Sg/Pl
        tr.appendChild(td(GR_ARTICLES.f[k].Sg));
        tr.appendChild(td(GR_ARTICLES.f[k].Pl));
        // n Sg/Pl
        tr.appendChild(td(GR_ARTICLES.n[k].Sg));
        tr.appendChild(td(GR_ARTICLES.n[k].Pl));

        tbody.appendChild(tr);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    host.innerHTML = "";
    host.appendChild(table);

    function td(text: string) {
        const cell = document.createElement("td");
        cell.textContent = text;
        return cell;
    }
})();
