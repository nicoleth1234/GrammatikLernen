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