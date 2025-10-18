export var Deklinationen;
(function (Deklinationen) {
    Deklinationen["A"] = "a";
    Deklinationen["O"] = "o";
    Deklinationen["Dritte"] = "3";
})(Deklinationen || (Deklinationen = {}));
export var Genus;
(function (Genus) {
    Genus["M"] = "m";
    Genus["F"] = "f";
    Genus["N"] = "n";
})(Genus || (Genus = {}));
export var Numerus;
(function (Numerus) {
    Numerus["Sg"] = "Sg";
    Numerus["Pl"] = "Pl";
})(Numerus || (Numerus = {}));
export var Kasus;
(function (Kasus) {
    Kasus["Nom"] = "Nom.";
    Kasus["Gen"] = "Gen.";
    Kasus["Dat"] = "Dat.";
    Kasus["Akk"] = "Akk.";
    Kasus["Abl"] = "Abl.";
    Kasus["Vok"] = "Vok.";
})(Kasus || (Kasus = {}));
export class Deklination {
    constructor(deklination, kasus, genus, numerus, endung) {
        this.deklination = deklination;
        this.kasus = kasus;
        this.genus = genus;
        this.numerus = numerus;
        this.endung = endung;
    }
}
