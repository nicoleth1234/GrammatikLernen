// src/utils/hover-global.ts
function normalize(s) {
    return (s || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}
function clearAll(root) {
    root.querySelectorAll(".endings-table td.match-hover")
        .forEach(td => td.classList.remove("match-hover"));
}
function findCells(root) {
    return Array.from(root.querySelectorAll(".endings-table tbody td"));
}
// attach once per page
export function attachGlobalEndingsHover(root = document) {
    root.addEventListener("mouseover", (ev) => {
        const td = ev.target.closest("td");
        if (!td || !td.closest(".endings-table"))
            return;
        const v = td.textContent || "";
        if (!v || normalize(v) === "—")
            return;
        const needle = normalize(v);
        clearAll(root);
        for (const cell of findCells(root)) {
            if (normalize(cell.textContent || "") === needle) {
                cell.classList.add("match-hover");
            }
        }
    });
    root.addEventListener("mouseout", (ev) => {
        // Nur leeren, wenn wir die Tabellenzone verlassen
        const toEl = ev.relatedTarget;
        if (!toEl || !toEl.closest || !toEl.closest(".endings-table")) {
            clearAll(root);
        }
    });
}
// Auto-run if included as module on a page
attachGlobalEndingsHover();
