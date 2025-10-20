// src/constants/gr-articles.ts
import type { Kasus, Numerus } from "../models/models.js";

// Nur die griechisch relevanten Kasus (ohne Abl.)
export const GR_KASUS_ORDER: Kasus[] = ["Nom.", "Gen.", "Dat.", "Akk."] as Kasus[];
const NUMS: Numerus[] = ["Sg", "Pl"] as Numerus[];

// Artikel-Tabellen je Genus: m, f, n
// Quelle: Standardparadigma ὁ/ἡ/τό
export type ArtikelTable = Record<Kasus, Record<Numerus, string>>;

export const GR_ARTICLES: Record<"m" | "f" | "n", ArtikelTable> = {
    m: {
        "Nom.": { Sg: "ὁ",   Pl: "οἱ"   },
        "Gen.": { Sg: "τοῦ", Pl: "τῶν"  },
        "Dat.": { Sg: "τῷ",  Pl: "τοῖς" },
        "Akk.": { Sg: "τόν", Pl: "τούς" },
        // Vokativ wird im Griechischen i.d.R. nicht verwendet → nicht geführt
    } as ArtikelTable,
    f: {
        "Nom.": { Sg: "ἡ",   Pl: "αἱ"   },
        "Gen.": { Sg: "τῆς", Pl: "τῶν"  },
        "Dat.": { Sg: "τῇ",  Pl: "ταῖς" },
        "Akk.": { Sg: "τήν", Pl: "τάς"  },
    } as ArtikelTable,
    n: {
        "Nom.": { Sg: "τό",  Pl: "τά"   },
        "Gen.": { Sg: "τοῦ", Pl: "τῶν"  },
        "Dat.": { Sg: "τῷ",  Pl: "τοῖς" },
        "Akk.": { Sg: "τό",  Pl: "τά"   },
    } as ArtikelTable,
};

export const GR_ARTICLE_GENDERS: Array<"m" | "f" | "n"> = ["m", "f", "n"];
export const GR_NUMS = NUMS;
