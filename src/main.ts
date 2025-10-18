const btnTables = document.getElementById("btn-tables");
const btnQuiz = document.getElementById("btn-quiz");

if (btnTables) {
    btnTables.addEventListener("click", () => window.location.href = "tables.html");
}
if (btnQuiz) {
    btnQuiz.addEventListener("click", () => window.location.href = "quiz.html");
}
