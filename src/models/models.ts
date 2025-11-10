export enum Deklinationen {
    A = "a",
    O = "o",
    Dritte = "3",
    U="u"
}

export enum Genus {
    M = "m",
    F = "f",
    N = "n"
}

export enum Numerus {
    Sg = "Sg",
    Pl = "Pl"
}

export enum Kasus {
    Nom = "Nom.",
    Gen = "Gen.",
    Dat = "Dat.",
    Akk = "Akk.",
    Abl = "Abl.",
    Vok = "Vok."
}

export class Deklination {
    constructor(
        public deklination: Deklinationen,
        public kasus: Kasus,
        public genus: Genus,
        public numerus: Numerus,
        public endung: string
    ) {}
}
