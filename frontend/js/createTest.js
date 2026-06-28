import { API_URL } from "../app.js";

let goTo;
let questionCounter = 0;

export function init(page, navigateTo) {

    if (navigateTo) {
        goTo = navigateTo;
    }

    if (page === "createTest") {
        const createTestForm = document.getElementById("createTestForm");
        if (createTestForm) {
            createTestForm.addEventListener(
                "submit",
                handleCreateTest
            );
        }
        const addQuestionButton = document.getElementById("addQuestionButton");
        console.log(addQuestionButton)
        if (addQuestionButton) {
            addQuestionButton.addEventListener(
                "click",
                addQuestion
            );
        }
    }
}

async function handleCreateTest(event) {

    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
        alert("You must be logged in");
        if (goTo) {
            goTo("login");
        }
        return;
    }

    const title = document.getElementById("title").value.trim();
    const timeLimit = Number(document.getElementById("time_limit").value);

    const questions = buildQuestions();

    console.log("Questions", questions);

    console.log({
        action: "create_test",
        title: title,
        classroom_id: "507f1f77bcf86cd799439011",
        time_limit: timeLimit,
        questions: questions
    });

    try {
        const response = await fetch(`${API_URL}/api/tests`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                action: "create_test",
                title: title,
                classroom_id: "507f1f77bcf86cd799439011",
                time_limit: timeLimit,
                questions: questions
            })
        });

        const data = await response.json();
        if (response.ok) {
            if (data.success) {
                alert("Test created successfully");
                document.getElementById("createTestForm").reset();
            } else {
                alert(data.message);
            }
        } else {
            alert(`Request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error("Connection Error:", error);
        alert("Impossible to connect to server");
    }
}

function addQuestion() {

    console.log("ADD QUESTION");

    questionCounter++;

    const container = document.getElementById("questionsContainer");

    const questionDiv = document.createElement("div");

    questionDiv.id = `questionContainer_${questionCounter}`;

    questionDiv.innerHTML = `
        <hr>
        <h3>Question ${questionCounter}</h3>
        <label>Question Type</label>
        <select id="type_${questionCounter}">
            <option value="multiple_choice">
                Multiple Choice
            </option>
            <option value="open_answer">
                Open Answer
            </option>
        </select>
        <br><br>
        <label>Question</label>
        <input
            type="text"
            id="question_${questionCounter}"
            required
        >
        <br><br>
        <label>Maximum Score</label>
        <input
            type="number"
            id="score_${questionCounter}"
            value="1"
            min="1"
            required
        >

        <br><br>
        
        ${createMultipleChoiceSection(questionCounter)}
        
        <button
            type="button"
            id="remove_${questionCounter}">
            Remove Question
        </button>

    `;

    container.appendChild(questionDiv);
    toggleQuestionType(questionCounter);

    document
        .getElementById(`remove_${questionCounter}`)
        .addEventListener("click", function () {
            questionDiv.remove();
        });

}

function createMultipleChoiceSection(questionCounter){
    return `
        <div id="answers_${questionCounter}">
            <label>Answer 1</label>
            <input
                type="text"
                id="answer1_${questionCounter}"
                required
            >
            <br><br>
            <label>Answer 2</label>
            <input
                type="text"
                id="answer2_${questionCounter}"
                required
            >
            <br><br>
            <label>Answer 3</label>
            <input
                type="text"
                id="answer3_${questionCounter}"
                required
            >
            <br><br>
            <label>Answer 4</label>
            <input
                type="text"
                id="answer4_${questionCounter}"
                required
            >
            <br><br>
            <label>Correct Answer</label>

            <select id="correct_${questionCounter}">
                <option value="1">Answer 1</option>
                <option value="2">Answer 2</option>
                <option value="3">Answer 3</option>
                <option value="4">Answer 4</option>
            </select>
            <br><br>
        </div>
    `;
}

function toggleQuestionType(questionCounter) {

    const questionType = document.getElementById(`type_${questionCounter}`);
    const answersSection = document.getElementById(`answers_${questionCounter}`);

    if (!questionType || !answersSection) {
        return;
    }

    questionType.addEventListener("change", function () {
        if (this.value === "open_answer") {
            answersSection.style.display = "none";
        } else {
            answersSection.style.display = "block";
        }
    });
}

function buildQuestions() {

    const questions = [];

    for (let i = 1; i <= questionCounter; i++) {
        const questionDiv = document.getElementById(`questionContainer_${i}`);

        // La domanda potrebbe essere stata eliminata
        if (!questionDiv) {
            continue;
        }

        const questionType = document.getElementById(`type_${i}`).value;
        const questionText = document.getElementById(`question_${i}`).value.trim();
        const maxScore = Number(document.getElementById(`score_${i}`).value);

        const question = {
            _id: `q${i}`,
            question_type: questionType,
            question: questionText,
            max_score: maxScore
        };

        if (questionType === "multiple_choice") {

            question.answers = [
                {
                    answer_id: 1,
                    text: document.getElementById(`answer1_${i}`).value.trim()
                },
                {
                    answer_id: 2,
                    text: document.getElementById(`answer2_${i}`).value.trim()
                },
                {
                    answer_id: 3,
                    text: document.getElementById(`answer3_${i}`).value.trim()
                },
                {
                    answer_id: 4,
                    text: document.getElementById(`answer4_${i}`).value.trim()
                }
            ];

            question.correct_answer = Number(
                document.getElementById(`correct_${i}`).value
            );

        } else {

            question.answers = null;
            question.correct_answer = null;

        }

        questions.push(question);
    }

    return questions;
}
