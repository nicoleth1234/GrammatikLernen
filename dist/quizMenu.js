"use strict";
// src/quizMenu.ts
/**
 * Navigiert zu einer HTML-Datei im selben Verzeichnis wie die aktuelle Seite,
 * unabhängig vom <base>-Tag. Funktioniert vor und nach dem "pages/..."-Move.
 */
function goSibling(file) {
    const url = new URL(window.location.href);
    // Verzeichnis der aktuellen Seite (ohne Dateinamen)
    const dir = url.pathname.replace(/[^/]+$/, ""); // alles nach letztem "/" weg
    url.pathname = dir + file;
    url.search = "";
    url.hash = "";
    window.location.href = url.toString();
}
function onClick(id, targetFile) {
    const btn = document.getElementById(id);
    if (!btn)
        return;
    btn.addEventListener("click", () => goSibling(targetFile));
}
// Zuordnungen
onClick("btn-active", "aktiv-quiz.html");
onClick("btn-passive", "passiv-quiz.html");
onClick("btn-match", "zuordnen-auswahl.html");
onClick("btn-form", "dekliniere-quiz.html");
