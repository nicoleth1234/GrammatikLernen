const btnActive = document.getElementById("btn-active");
if (btnActive) {
    btnActive.addEventListener("click", () => {
        window.location.href = "aktiv-quiz.html";
    });
}
const btnPassive = document.getElementById("btn-passive");
if (btnPassive) {
    btnPassive.addEventListener("click", () => (window.location.href = "passiv-quiz.html"));
}
const btnMatch = document.getElementById("btn-match");
if (btnMatch) {
    btnMatch.addEventListener("click", () => (window.location.href = "zuordnen-auswahl.html"));
}
const btnForm = document.getElementById("btn-form");
if (btnForm) {
    btnForm.addEventListener("click", () => (window.location.href = "dekliniere-quiz.html"));
}
