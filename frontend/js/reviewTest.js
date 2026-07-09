import { API_URL } from "../app.js";
import { loadSidebar } from "./utils.js";

let goTo;

export async function init(page, navigateTo) {

    if (navigateTo) {
        goTo = navigateTo;
    }

    await loadSidebar(navigateTo);

    if (page === "reviewTest") {
        loadReviewTest();

        const backButton = document.getElementById("backButton");

        if (backButton) {
            backButton.addEventListener("click", function () {
                goTo("classroomTest");
            });
        }
    }
}

async function loadReviewTest() {

    const token = localStorage.getItem("token");
    const testId = localStorage.getItem("test_id");

    if (!token) {
        alert("You must be logged in");
        goTo("login");
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/student/tests?action=get_review_test&test_id=${testId}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.ok) {
            displayReviewTest(data.data);
        } else {
            alert(data.message);
        }

    } catch (error) {
        console.error(error);
        alert("Impossible to connect to server");
    }
}

function displayReviewTest(test) {

    const container = document.getElementById("reviewContainer");

    container.innerHTML = `
        <h2>${test.title}</h2>
        <p>
            <strong>Status:</strong> ${test.status}
        </p>
        <p>
            <strong>Final Score:</strong> ${test.score}
        </p>
        <p>
            <strong>Submitted:</strong>
            ${new Date(test.completed_date).toLocaleString("it-IT")}
        </p>
        <hr>
    `;

    test.questions.forEach((question, index) => {

        container.innerHTML += `
            <h3>Question ${index + 1}</h3>

            <p>
                <strong>Question:</strong><br>
                ${question.question_text}
            </p>

            <p>
                <strong>Your Answer:</strong><br>
                ${question.given_answer_text}
            </p>

            <p>
                <strong>Assigned Score:</strong>
                ${question.score_assigned}
            </p>

            <hr>
        `;
    });
}

