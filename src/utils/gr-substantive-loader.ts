export interface GrSubstantiv {
    deklination: string;  // "a" oder "o"
    typ: string;          // "1","2","3a","3b" oder "-"
    genus: "f"|"m"|"n";
    stamm: string;
    nomSg: string;
    istKurz: boolean;
}

export async function ladeGrSubstantive(): Promise<GrSubstantiv[]> {
    const res = await fetch("assets/data/gr_substantive.csv");
    const txt = await res.text();
    const lines = txt.trim().split(/\r?\n/);
    const [header, ...rows] = lines.map(l => l.split(","));
    const idx = {
        Deklination: header.indexOf("Deklination"),
        Typ: header.indexOf("Typ"),
        Genus: header.indexOf("Genus"),
        Stamm: header.indexOf("Stamm"),
        NomSg: header.indexOf("Nom. Sg"),
        Kurz: header.indexOf("ist_kurz")
    };
    return rows.map(r => ({
        deklination: r[idx.Deklination].trim(),
        typ: r[idx.Typ].trim(),
        genus: r[idx.Genus].trim() as "f"|"m"|"n",
        stamm: r[idx.Stamm].trim(),
        nomSg: r[idx.NomSg].trim(),
        istKurz: r[idx.Kurz].trim().toLowerCase() === "true"
    }));
}
