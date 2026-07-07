import { API_URL } from "../app.js";

let goTo;
let currentTest = null
let timerInterval = null;
let currentQuestionIndex = 0;
let studentAnswers = []

// Initialize the test page
export function init(page, navigateTo){

    if(navigateTo){
        goTo = navigateTo;
    }
    if(page === "startTest"){
        loadTest();
    }
}

// start the selected test
async function loadTest(){

    const token = localStorage.getItem("token");
    // check if the user is authenticated
    if(!token){
        alert("You must be logged in");
        if(goTo){
            goTo("login");
        }
        return;
    }

    // Get the selected test id
    const testId = localStorage.getItem("test_id");

    try{
        // request a new test session from the backend
        const response = await fetch(`${API_URL}/student/tests`,{

            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${token}`
            },

            body: JSON.stringify({
                action:"start_test",
                test_id: testId,
            })
        });

        const data = await response.json();

        if(response.ok){
            displayTest(data.message);
        }else{
            alert(data.message);
        }

    }catch(error){
        console.error(error);
        alert("Impossible to connect to server");
    }
}

function displayQuestion(index) {

    const container = document.getElementById("questionsContainer");

    container.innerHTML = "";

    const question = currentTest.questions[index];

    const div = document.createElement("div");

    let answersHtml = "";

    // Display answer options based on the question type
    if (question.question_type === "multiple_choice") {
        question.answers.forEach(answer => {
            answersHtml += `
                    <label>
                        <input
                            type="radio"
                            name="question"
                            value="${answer.answer_id}">
                        ${answer.text}
                    </label>
                    <br>
                `;
        });
    } else {
        // create the question card for open answer
        answersHtml = `
                <textarea
                    id="openAnswer"
                    rows="5"
                    cols="60"
                    placeholder="Write your answer here...">
                </textarea>
           `;
    }

    div.innerHTML = `
    <hr>
        <h3>Question ${index + 1} / ${currentTest.questions.length}</h3>
        <p>${question.question}</p>
        ${answersHtml}

        <br><br>
        <button
            id="previousButton"
            ${index === 0 ? "disabled" : ""}>
            Previous
        </button>

        ${
        index === currentTest.questions.length - 1 ?
            `<button id="submitButton">
            Submit Test
             </button>`
            :
            `<button id="nextButton">
            Next
        </button>`
    }`;
    container.appendChild(div);
    restoreAnswers(index)

    // Previous question
    const previousButton = document.getElementById("previousButton");

    if (previousButton) {
        previousButton.addEventListener("click", function () {
            saveCurrentAnswer()
            currentQuestionIndex--;
            displayQuestion(currentQuestionIndex);
        });
    }

    // Next question
    const nextButton = document.getElementById("nextButton");

    if (nextButton) {
        nextButton.addEventListener("click", function () {
            saveCurrentAnswer();
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
        });
    }

    // Submit test
    const submitButton = document.getElementById("submitButton");

    if (submitButton) {
        submitButton.addEventListener("click", function () {
            saveCurrentAnswer();
            submitTest();
        });
    }
}

// Save the current answers
function saveCurrentAnswer(){
    const question = currentTest.questions[currentQuestionIndex];

    if(question.question_type === "multiple_choice"){
        const selected = document.querySelector('input[name="question"]:checked');

        studentAnswers[currentQuestionIndex] = {
            question_id: question.question_id,
            given_answer_id: selected ? Number(selected.value) : null
        };
    }else{
        studentAnswers[currentQuestionIndex] = {
            question_id: question.question_id,
            given_answer: document.getElementById("openAnswer").value.trim()
        };
    }
}

// Restore the previously saved answer
function restoreAnswers(index) {

    const question = currentTest.questions[index];
    const savedAnswer = studentAnswers[index];

    if (!savedAnswer) {
        return;
    }

    if (question.question_type === "multiple_choice") {
        const radio = document.querySelector(
            `input[name="question"][value="${savedAnswer.given_answer_id}"]`
        );
        if (radio) {
            radio.checked = true;
        }
    } else {
        const textArea = document.getElementById("openAnswer");
        if (textArea) {
            textArea.value = savedAnswer.given_answer;
        }
    }
}

// Display the test questions
function displayTest(test){

    currentTest = test;

    // initialize the answer list
    studentAnswers = new Array(test.questions.length).fill(null)

    // start from the first question
    currentQuestionIndex = 0;

    // Display basic test information
    document.getElementById("testTitle").textContent = test.title;

    // start the countdown timer
    startTimer(test.time_limit);

    // Display the first question
    displayQuestion(currentQuestionIndex)
}


// function fo start the countdown timer
function startTimer(minutes){
    let timeLeft = minutes * 60;

    timerInterval = setInterval(() => {
        const minutesLeft = Math.floor(timeLeft / 60);
        const secondsLeft = timeLeft % 60;
        document.getElementById("timer").textContent = `${minutesLeft}:${secondsLeft.toString().padStart(2, "0")}`;

        if(timeLeft <= 0){
            clearInterval(timerInterval);
            saveCurrentAnswer();
            alert("Time is over!");
            submitTest();
        }
        timeLeft--;
    }, 1000);
}


// collect all student answers
function buildAnswers(test){
    return studentAnswers;
}

// submit the completed test
async function submitTest(){

    const token = localStorage.getItem("token");

    if(!token){
        alert("You must be logged in");
        if(goTo){
            goTo("login");
        }
        return;
    }

    // Build the submission payload
    const answers = buildAnswers(currentTest);

    try{
        // Send the completed test to the backend
        const response = await fetch(`${API_URL}/student/tests`, {
            method: "POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                action: "submit_test",
                test_id: currentTest.test_id,
                answers: answers
            })

        });

        const data = await response.json();

        if(response.ok){
            // Stop the time after a successful submission
            clearInterval(timerInterval);
            alert("Test submitted successfully");
            goTo("classroomTest")
        }else{
            alert(data.message);
        }

    }catch(error){
        console.error(error);
        alert("Impossible to connect to server");
    }
}
