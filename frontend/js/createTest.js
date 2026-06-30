import { API_URL } from "../app.js";

let goTo;
let questionCounter = 0;

// initialize the test creation page
export function init(page, navigateTo) {

    if (navigateTo) {
        goTo = navigateTo;
    }

    // Register from and button events
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

// Create a new test
async function handleCreateTest(event) {

    event.preventDefault();

    const token = localStorage.getItem("token");

    // check if the user is authenticated
    if (!token) {
        alert("You must be logged in");
        if (goTo) {
            goTo("login");
        }
        return;
    }

    // collect the test information
    const title = document.getElementById("title").value.trim();
    const timeLimit = Number(document.getElementById("time_limit").value);

    // Build the question list
    const questions = buildQuestions();

    try {
        // Send the new test to the backend
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

// Add a new question to the form
function addQuestion() {

    // Generate a unique question id
    questionCounter++;

    const container = document.getElementById("questionsContainer");

    // create the question container
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

    // Add the question to the page
    container.appendChild(questionDiv);
    toggleQuestionType(questionCounter);

    // remove the selected question
    document.getElementById(`remove_${questionCounter}`).addEventListener("click", function () {questionDiv.remove();});
}


// Create the multiple-choice answer section
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


// TQoggle the questio type
function toggleQuestionType(questionCounter) {

    const questionType = document.getElementById(`type_${questionCounter}`);
    const answersSection = document.getElementById(`answers_${questionCounter}`);

    if (!questionType || !answersSection) {
        return;
    }

    questionType.addEventListener("change", function () {

        const answersInput = answersSection.querySelectorAll("input");

        // show or hide the answer section
        if (this.value === "open_answer") {
            answersSection.style.display = "none";
            answersInput.forEach(input => {
                input.required = false;
            })
        } else {
            answersSection.style.display = "block";
            answersInput.forEach(input => {
                input.required = true;
            });

        }
    });
}


// build the question list for the backend
function buildQuestions() {

    const questions = [];

    // process all created questions
    for (let i = 1; i <= questionCounter; i++) {
        const questionDiv = document.getElementById(`questionContainer_${i}`);

        // skip removed questions
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

        // Buld the question based on its type
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

            // open questions do not have predefines answers
        } else {
            question.answers = null;
            question.correct_answer = null;
        }
        // add the question to the test
        questions.push(question);
    }
    // return the complete question list
    return questions;
}
