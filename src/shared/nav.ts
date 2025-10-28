// src/shared/nav.ts

/** Pfadanteil (Verzeichnis) ohne Dateiname */
function dirname(pathname: string): string {
    return pathname.replace(/[^/]+$/, "");
}

/** Versucht zu erkennen, wo dein Projekt-Root liegt (…/deklinationen/). */
function detectProjectRoot(pathname: string): string {
    const m = pathname.match(/^(.*?\/)pages\/(latin|greek)\//);
    if (m) return m[1];                 // .../deklinationen/
    return dirname(pathname);            // Fallback: aktuelles Verzeichnis
}

/** HEAD-Check, ob URL existiert (gleiche Origin!). */
async function exists(url: string): Promise<boolean> {
    try {
        const res = await fetch(url, { method: "HEAD" });
        return res.ok;
    } catch {
        return false;
    }
}

/** Navigiert zu quiz.html – bevorzugt im selben Verzeichnis, sonst im Projekt-Root. */
export async function goToQuiz(): Promise<void> {
    const cur = new URL(window.location.href);
    const dir = dirname(cur.pathname);
    const root = detectProjectRoot(cur.pathname);

    const sibling = dir + "quiz.html";
    const rootUrl = root + "quiz.html";

    const target = (await exists(sibling)) ? sibling
        : (await exists(rootUrl)) ? rootUrl
            : null;

    if (target) {
        cur.pathname = target;
        cur.search = "";
        cur.hash = "";
        window.location.href = cur.toString();
        return;
    }

    // Letzter Fallback: Wenn du den Hash-Router aktiv hast, nimm dessen Route:
    // window.location.hash = "/latin/quiz";  // ggf. anpassen
}

/** Verknüpft einen Back-Link mit goToQuiz(). */
export function wireBackLinkToQuiz(selector: string = 'a[href$="quiz.html"]') {
    const a = document.querySelector(selector) as HTMLAnchorElement | null;
    if (!a) return;
    a.addEventListener("click", (ev) => {
        ev.preventDefault();
        void goToQuiz();
    });
}

/** Allgemein: Navigiere zu Datei im selben Ordner (unabhängig von <base>) */
export function goSibling(file: string) {
    const url = new URL(window.location.href);
    url.pathname = dirname(url.pathname) + file;
    url.search = "";
    url.hash = "";
    window.location.href = url.toString();
}

/** Navigiere zu einer Datei im selben Ordner und übernimm eine Query-String (ohne führendes "?"). */
export function goSiblingTo(file: string, search: string = ""): void {
    const url = new URL(window.location.href);
    const dir = url.pathname.replace(/[^/]+$/, ""); // Verzeichnis der aktuellen Seite
    url.pathname = dir + file;
    url.search = search ? (search.startsWith("?") ? search : "?" + search) : "";
    url.hash = "";
    window.location.href = url.toString();
}

/** Navigiert im selben Verzeichnis zurück zum griechischen Nomen-Menü. */
export function wireBackLinkToGreekNounsMenu(
    selector: string = 'a[href$="quiz-gr-nouns-menu.html"]'
) {
    const a = document.querySelector(selector) as HTMLAnchorElement | null;
    if (!a) return;
    a.addEventListener("click", (ev) => {
        ev.preventDefault();
        const url = new URL(window.location.href);
        const dir = url.pathname.replace(/[^/]+$/, ""); // aktuelles Verzeichnis
        url.pathname = dir + "quiz-gr-nouns-menu.html";
        url.search = "";
        url.hash = "";
        window.location.href = url.toString();
    });
}

