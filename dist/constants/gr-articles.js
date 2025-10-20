// Nur die griechisch relevanten Kasus (ohne Abl.)
export const GR_KASUS_ORDER = ["Nom.", "Gen.", "Dat.", "Akk."];
const NUMS = ["Sg", "Pl"];
export const GR_ARTICLES = {
    m: {
        "Nom.": { Sg: "ὁ", Pl: "οἱ" },
        "Gen.": { Sg: "τοῦ", Pl: "τῶν" },
        "Dat.": { Sg: "τῷ", Pl: "τοῖς" },
        "Akk.": { Sg: "τόν", Pl: "τούς" },
        // Vokativ wird im Griechischen i.d.R. nicht verwendet → nicht geführt
    },
    f: {
        "Nom.": { Sg: "ἡ", Pl: "αἱ" },
        "Gen.": { Sg: "τῆς", Pl: "τῶν" },
        "Dat.": { Sg: "τῇ", Pl: "ταῖς" },
        "Akk.": { Sg: "τήν", Pl: "τάς" },
    },
    n: {
        "Nom.": { Sg: "τό", Pl: "τά" },
        "Gen.": { Sg: "τοῦ", Pl: "τῶν" },
        "Dat.": { Sg: "τῷ", Pl: "τοῖς" },
        "Akk.": { Sg: "τό", Pl: "τά" },
    },
};
export const GR_ARTICLE_GENDERS = ["m", "f", "n"];
export const GR_NUMS = NUMS;
