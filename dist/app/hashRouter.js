// src/app/hashRouter.ts
import { ROUTES } from "../router.js";
const BASE = ""; // deine HTMLs liegen direkt unter /deklinationen/
function normalizeHash() {
    // erlaubt #/latin/verbs (empfohlen) und fallback auf #latin/verbs
    let h = (window.location.hash || "").replace(/^#/, "");
    if (!h.startsWith("/"))
        h = "/" + h;
    return h;
}
function findRoute(hashPath) {
    var _a;
    // entferne Query/Fragment am Ende
    const clean = hashPath.split("?")[0].split("#")[0];
    return (_a = ROUTES.find(r => r.path === clean)) !== null && _a !== void 0 ? _a : null;
}
export function mountRouter(iframeId = "app-frame", defaultRoute = "/") {
    const frame = document.getElementById(iframeId);
    if (!frame)
        return;
    function navigate() {
        const h = normalizeHash();
        if (h === "/" || h === "/home" || h === "/index") {
            document.title = "Start";
            frame.src = "about:blank"; // belasse index-Startscreen sichtbar
            return;
        }
        const route = findRoute(h);
        if (!route) {
            document.title = "Seite nicht gefunden";
            // Optional: eigene 404-Seite
            frame.srcdoc = `<h2 style="font-family:system-ui">404 – unbekannte Route: ${h}</h2>`;
            return;
        }
        document.title = route.title || route.path;
        // Wichtig: relative Pfade der Ziel-HTMLs bleiben gültig,
        // da das iframe sie aus dem gleichen Ordner lädt.
        frame.src = route.file;
    }
    // Intercept interner Links auf bekannte HTML-Dateien → in Hash-Routen umschreiben
    document.addEventListener("click", (ev) => {
        var _a, _b;
        const a = (_b = (_a = ev.target) === null || _a === void 0 ? void 0 : _a.closest) === null || _b === void 0 ? void 0 : _b.call(_a, "a");
        if (!a)
            return;
        const href = a.getAttribute("href") || "";
        if (!href.endsWith(".html"))
            return;
        // index.html weiterhin normal erlauben
        if (/^index\.html$/i.test(href))
            return;
        const file = href.replace(/^.\//, "");
        const route = ROUTES.find(r => r.file === file);
        if (route) {
            ev.preventDefault();
            window.location.hash = route.path;
        }
    });
    window.addEventListener("hashchange", navigate);
    navigate(); // initial
}
