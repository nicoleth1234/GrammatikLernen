// src/router.ts
type Route = { path: string; file: string; title?: string };

export const ROUTES: Route[] = [
    // Latin
    { path: "/latin/verbs",          file: "tables-la-verbs.html",   title: "Latein – Verben" },
    { path: "/latin/tables",         file: "tables.html",            title: "Latein – Tabellen" },
    { path: "/latin/quiz/aktiv",     file: "aktiv-quiz.html",        title: "Latein – Aktiv-Quiz" },
    { path: "/latin/quiz/passiv",    file: "passiv-quiz.html",       title: "Latein – Passiv-Quiz" },
    { path: "/latin/quiz/dekl",      file: "dekliniere-quiz.html",   title: "Latein – Deklinations-Quiz" },
    { path: "/latin/quiz/zuordnen",  file: "zuordnen-quiz.html",     title: "Latein – Zuordnen-Quiz" },
    { path: "/latin/quiz/auswahl",   file: "zuordnen-auswahl.html",  title: "Latein – Zuordnen-Auswahl" },

    // Greek
    { path: "/greek/nouns",          file: "tables-gr.html",         title: "Griechisch – Substantive" },
    { path: "/greek/articles",       file: "tables-gr-articles.html",title: "Griechisch – Artikel" },
    { path: "/greek/quiz/articles",  file: "quiz-gr-articles.html",  title: "Griechisch – Artikel-Quiz" },
    { path: "/greek/quiz/nouns",     file: "quiz-gr-nouns.html",     title: "Griechisch – Nomen-Quiz" },
    { path: "/greek/quiz/nouns-menu",file: "quiz-gr-nouns-menu.html",title: "Griechisch – Nomen-Quiz-Menü" },

    // Sonstiges (falls genutzt)
    { path: "/latin/quiz",           file: "quiz.html",              title: "Latein – Quiz" },
];
