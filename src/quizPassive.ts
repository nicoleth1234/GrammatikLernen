// src/quizPassive.ts
import { ladeSubstantive, Substantiv } from "./utils/substantive-loader.js";
import { ladeCsvDatei } from "./utils/csv-loader.js";
import { buildEndungenIndex, keyOf } from "./utils/endung-index.js";
import { bildeFormenDyn, KASUS_ORDER } from "./utils/morpho.js";
import { Deklinationen, Genus, Kasus, Numerus } from "./models/models.js";

const KASUS_NO_VOK: Kasus[] = [Kasus.Nom, Kasus.Gen, Kasus.Dat, Kasus.Akk, Kasus.Abl];

function normalize(s: string): string {
    return (s || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

type Frage = {
    surface: string;                     // angezeigte Form
    korrekteKasus: Set<Kasus>;           // alle zulässigen Kasus für diese Oberfläche
    moeglicheNumeri: Set<Numerus>;       // Sg/Pl, die zur Oberfläche passen
    subst: Substantiv;                   // für Hinweis
};

function makeQuestion(s: Substantiv, endIdx: ReturnType<typeof buildEndungenIndex>): Frage {
    const formen = bildeFormenDyn(s, endIdx);

    // Kandidaten = alle Formen ausser Vokativ
    const candidates: Array<{ kasus: Kasus; numerus: Numerus; form: string }> = [];
    for (const k of KASUS_NO_VOK) {
        for (const n of [Numerus.Sg, Numerus.Pl] as const) {
            const f = formen[k][n];
            if (f && f !== "—") candidates.push({ kasus: k, numerus: n, form: f });
        }
    }

    const chosen = pickRandom(candidates);
    const surfNorm = normalize(chosen.form);

    // alle Kasus/Numeri sammeln, die gleich aussehen
    const korrekteKasus = new Set<Kasus>();
    const moeglicheNumeri = new Set<Numerus>();
    for (const k of KASUS_NO_VOK) {
        const fSg = normalize(formen[k][Numerus.Sg]);
        const fPl = normalize(formen[k][Numerus.Pl]);
        if (fSg === surfNorm) { korrekteKasus.add(k); moeglicheNumeri.add(Numerus.Sg); }
        if (fPl === surfNorm) { korrekteKasus.add(k); moeglicheNumeri.add(Numerus.Pl); }
    }

    return { surface: chosen.form, korrekteKasus, moeglicheNumeri, subst: s };
}

// --- UI refs ---
const wordEl = document.getElementById("word")!;
const hintEl = document.getElementById("hint")!;
const fbEl = document.getElementById("feedback")!;
const buttonsWrap = document.getElementById("buttons")! as HTMLDivElement;
const btnHint = document.getElementById("btn-hint") as HTMLButtonElement;

let current: Frage | null = null;
let endIdx: ReturnType<typeof buildEndungenIndex>;
let substantive: Substantiv[] = [];

function setFeedback(msg: string, ok: boolean) {
    fbEl.textContent = msg;
    fbEl.className = ok ? "ok" : "err";
}

function renderQuestion() {
    const s = pickRandom(substantive);
    current = makeQuestion(s, endIdx);

    wordEl.textContent = current.surface;
    hintEl.textContent = "";       // Hinweistext löschen
    btnHint.style.display = "inline-block"; // Button wieder anzeigen
    setFeedback("", true);
}

async function start() {
    try {
        const [subst, endRows] = await Promise.all([
            ladeSubstantive(),
            (async () => {
                const csv = await ladeCsvDatei("assets/data/deklinationen.csv");
                const header = csv[0];
                const idx = {
                    Deklination: header.indexOf("Deklination"),
                    Kasus: header.indexOf("Kasus"),
                    Genus: header.indexOf("Genus"),
                    Numerus: header.indexOf("Numerus"),
                    Endung: header.indexOf("Endung"),
                };
                for (const [k, v] of Object.entries(idx)) if (v === -1) throw new Error(`CSV-Header fehlt Spalte: ${k}`);
                return csv.slice(1).map(r => ({
                    deklination: r[idx.Deklination].trim() as unknown as Deklinationen,
                    kasus: r[idx.Kasus].trim() as unknown as Kasus,
                    genus: r[idx.Genus].trim() as unknown as Genus,
                    numerus: r[idx.Numerus].trim() as unknown as Numerus,
                    endung: r[idx.Endung].trim(),
                }));
            })()
        ]);

        substantive = subst;
        endIdx = buildEndungenIndex(endRows as any);
        substantive = substantive.filter(s => endIdx.has(keyOf(s.dekl, s.genus)));

        renderQuestion();

        // Kasus-Klicks (Delegation)
        buttonsWrap.addEventListener("click", (e) => {
            const btn = (e.target as HTMLElement).closest("button[data-kasus]");
            if (!btn || !current) return;

            const chosenKasus = btn.getAttribute("data-kasus") as Kasus;
            const ok = current.korrekteKasus.has(chosenKasus);

            if (ok) {
                setFeedback("Richtig! ✅", true);
                setTimeout(renderQuestion, 650);
            } else {
                // KEINE sofortige Nennung der richtigen Kasus
                setFeedback("Leider nein. Versuch es nochmals – oder nutze «Hinweis».", false);
            }
        });

        // Hinweis-Button
        btnHint.addEventListener("click", () => {
            if (!current) return;
            const { subst, moeglicheNumeri } = current;

            const nums = Array.from(moeglicheNumeri).join("/");
            hintEl.textContent = `${subst.dekl}-Deklination, ${subst.genus}, ${nums}`;

            // Button ausblenden, sobald Hinweis gezeigt wird
            btnHint.style.display = "none";
        });

    } catch (err) {
        console.error(err);
        wordEl.textContent = "Fehler beim Laden.";
    }
}

start();
