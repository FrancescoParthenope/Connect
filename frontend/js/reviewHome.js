import { loadSidebar } from "./utils.js";

let goTo;

export async function init(page, navigateTo) {

    if (navigateTo) {
        goTo = navigateTo;
    }

    await loadSidebar(navigateTo);

    const cardWriteReview = document.getElementById("cardWriteReview");
    const cardViewReview = document.getElementById("cardViewReview");

    if (cardWriteReview) {
        cardWriteReview.addEventListener("click", () => {
            goTo("writeReview");
        });
    }

    if (cardViewReview) {
        cardViewReview.addEventListener("click", () => {
            goTo("viewReview");
        });
    }
}