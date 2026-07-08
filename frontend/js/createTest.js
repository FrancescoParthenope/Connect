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
        if (addQuestionButton) {
            addQuestionButton.addEventListener(
                "click",
                addQuestion
            );
        }

        const backButton = document.getElementById("backButton");
        if (backButton) {
            backButton.addEventListener("click", () => {
                goTo("main");
            })
        }
    }
}

async function handleCreateTest(event) {

    event.preventDefault();

    const token = localStorage.getItem("token");
    const classroomId = localStorage.getItem("classroomId");

    if (!token) {
        alert("You must be logged in");
        if (goTo) {
            goTo("login");
        }
        return;
    }
    if (!classroomId){
        alert("Cannot retrieve classroom ID, returning to classrooms homepage");
        goTo("classroomHome");
    }


    const title = document.getElementById("title").value.trim();
    const timeLimit = Number(document.getElementById("time_limit").value);

    const questions = buildQuestions();

    try {
        const response = await fetch(`${API_URL}/tests`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                action: "create_test",
                title: title,
                classroom_id: `${classroomId}`,
                time_limit: timeLimit,
                questions: questions
            })
        });

        const data = await response.json();
        if (response.ok) {
            if (data.success) {
                alert("Test created successfully");
                goTo("classroomTest");
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

    questionCounter++;

    const container = document.getElementById("createQuestionsContainer");

    const questionDiv = document.createElement("div");

    questionDiv.id = `createQuestionsContainer_${questionCounter}`;

    questionDiv.className = "questionCard"

    questionDiv.innerHTML = `
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
        <label>Question</label>
        <input
            type="text"
            id="question_${questionCounter}"
            required >
        <div id="scoreContainer_${questionCounter}">   
            <label>Maximum Score</label>
            <input
                type="number"
                id="score_${questionCounter}"
                value="1"
                min="1"
                required
            >
        </div>     
            ${createMultipleChoiceSection(questionCounter)}
            <button
                type="button"
                id="remove_${questionCounter}">
                Remove Question
            </button>
    `;

    container.appendChild(questionDiv);
    toggleQuestionType(questionCounter);

    document.getElementById(`remove_${questionCounter}`).addEventListener("click", function () {questionDiv.remove();});
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
    const scoreContainer = document.getElementById(`scoreContainer_${questionCounter}`);
    const scoreInput = document.getElementById(`score_${questionCounter}`);

    if (!questionType || !answersSection || !scoreContainer || !scoreInput) {
        return;
    }

    questionType.addEventListener("change", function () {

        const answersInput = answersSection.querySelectorAll("input");

        // show or hide the answer section
        if (this.value === "open_answer") {
            answersSection.style.display = "none";
            answersInput.forEach(input => {
                input.required = false;
            });
            scoreContainer.style.display = "none";
            scoreInput.required = false;
        } else {
            answersSection.style.display = "block";
            answersInput.forEach(input => {
                input.required = true;
            });
            scoreContainer.style.display = "block";
            scoreInput.required = true;
        }
    });
}

function buildQuestions() {

    const questions = [];

    for (let i = 1; i <= questionCounter; i++) {
        const questionDiv = document.getElementById(`createQuestionsContainer_${i}`);

        // skip removed questions
        if (!questionDiv) {
            continue;
        }

        const questionType = document.getElementById(`type_${i}`).value;
        const questionText = document.getElementById(`question_${i}`).value.trim();

        const question = {
            _id: `q${i}`,
            question_type: questionType,
            question: questionText,
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

            question.correct_answer = Number(document.getElementById(`correct_${i}`).value);
            question.max_score = Number(document.getElementById(`score_${i}`).value);


        } else {
            question.answers = null;
            question.correct_answer = null;
            question.max_score = null;
        }
        questions.push(question);
    }
    return questions;
}
