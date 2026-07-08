import {API_URL} from "../app.js";
import {formatTime, postFunction, linkToMain} from "./utils.js"

const base_route = "tutor_tests"

let goTo;

let subjects = [];
let activeTests = [];
let completedTests = [];
let testToTake;
let timerInterval;
let currentQuestionIndex = 0;

export async function init(page, navigateTo){
    if (navigateTo)
        goTo = navigateTo;

    if (page === 'eligibleSubjects'){
        linkToMain(goTo);
        const fieldSelection = document.getElementById('fieldSelection')
        if (fieldSelection) {
            fieldSelection.addEventListener('change', event => {
                filterSubjects(event.target.value);
            })
        }
        await getEligibleSubjects();
        setupCandidateListener()
    }

    if (page === 'activeApplications'){
        await getActiveTests();
        linkToMain(goTo);
        setupStartOrContinueListener()
    }

    if (page === 'completedApplications'){
        await getCompletedTests();
        linkToMain(goTo);
    }

    if (page === 'tutorTest'){
        populateTestPage();
    }
}

async function getEligibleSubjects() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch (`${API_URL}/tutor_tests/eligible_subjects`,{
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
                }
        });

        const data = await response.json();

        if (response.ok){
            subjects = data.message;
            populateSelect();
            filterSubjects("all");
        }

        else {
            alert(`Error: ${data.message}`);
        }
    }

    catch (error) {
        console.error("Connection Error:", error)
        alert(`Impossible to connect to server`)
    }
}

function populateSelect(){
    const fieldSelection = document.getElementById("fieldSelection");
    if (fieldSelection){
        fieldSelection.innerHTML = '<option value ="all" selected>All</option>';

        // extracting the elements in the field camp in the JSON type returned from server
        // using Set to eliminate duplicates of the fields
        // .map to indicate the element to extract
        // ... spread operator used to get the single field extracted

        const fields = [... new Set(subjects.map(s => s.field))]

        // now that we have the array with the right fields, we populate the options

        fields.forEach(field => {
            const option = document.createElement("option");
            option.value = field;
            option.textContent = field;
            fieldSelection.appendChild(option);
        });
    }
}

function filterSubjects(selectedField){
    const container = document.getElementById('subjectsContainer');

    container.innerHTML = ''; // clearing the container
    const filtered = (selectedField === 'all') ?
        subjects : subjects.filter(s => s.field === selectedField);

    filtered.forEach(subject => {
        const card = document.createElement("div");
        card.className = "subjectCard";
        card.innerHTML = `
            <h3>${subject.name}</h3>
            <button class="candidate-btn" data-id="${subject._id}">Candidate</button>
        `;
        container.appendChild(card);
        container.appendChild(document.createElement("hr"))
    });
}

async function getActiveTests() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tutor_tests/pending_tests`, {
            method: 'GET',
            headers: {'Authorization': `Bearer ${token}`}
        });

        const data = await response.json();

        if (response.ok) {
            if (data.status) {
                activeTests = data.message;
                populateActiveTests()
            } else {
                alert(`Error: ${response.status}: ${data.message}`);
            }
        } else {
            alert(`Error: ${data.message}`);
        }
    }
    catch (error) {
        console.error("Connection Error:", error)
        alert(`Impossible to connect to server`)
    }
}

async function getCompletedTests() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tutor_tests/completed`, {
            method: 'GET',
            headers: {'Authorization': `Bearer ${token}`}
        });

        const data = await response.json();

        if (response.ok) {
            if (data.status) {
                completedTests = data.message;
                populateCompletedTests()
            }
            else {
                alert(`Error: ${response.status}: ${data.message}`);
            }
        } else {
            alert(`Error: ${data.message}`);
        }
    }
    catch (error) {
        console.error("Connection Error:", error)
        alert(`Impossible to connect to server`)
    }
}

function populateActiveTests() {
    const container = document.getElementById('subjectsContainer');
    if (container) {
        container.innerHTML = '';
        activeTests.forEach(test => {
            const card = document.createElement("div");
            card.className = "subjectCard";

            const buttonText = (test.assigned_status === 'pending') ? 'Start Test' : 'Continue Test';
            card.innerHTML = `
            <h3>${test.subject_name}</h3>
            <div>
                <span>Status: ${test.assigned_status}</span>
                <button class="execute-btn" data-id="${test.subject_id}"> ${buttonText}</button>
            </div>
            `;
            container.appendChild(card);
            container.appendChild(document.createElement("hr"));
        })
    }
}

function populateCompletedTests() {
    const container = document.getElementById('subjectsContainer');
    if (container) {
        container.innerHTML = '';
        completedTests.forEach(test => {
            const convertedAssigned = new Date(test.assigned_date);
            const convertedCompleted = new Date(test.completed_date);

            const formatAssignedDate = convertedAssigned.toLocaleDateString(
                undefined,
                {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }
            );
            const formatCompletedDate = convertedCompleted.toLocaleDateString(
                undefined,
                {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }
            )
            const card = document.createElement("div");
            card.className = "subjectCard";
            card.innerHTML = `
                <h3>${test.subject_name}</h3>
                <div>
                    <p>Status: ${test.application_status}</p>
                    <p>Requested in: ${formatAssignedDate}, submitted in: ${formatCompletedDate} </p>
                </div>
            `;
            container.appendChild(card);
            container.appendChild(document.createElement("hr"));
        })
    }
}

async function applyForSubject(subjectId){
    try {
        const body = {
            "subjectId": subjectId
        }

        await postFunction(`${base_route}/add_application`, body);

        goTo("eligibleSubjects");
    }

    catch (error){
        if (error.isServerError){
            alert(`Error: ${error.message}`);
        }
        else {
            console.error("Connection Error:", error)
            alert(`Impossible to connect to server or internal server error`)
        }
    }
}

function setupCandidateListener(){
    const container = document.getElementById('subjectsContainer');
    if (container){
        container.addEventListener('click', event => {
            if (event.target.classList.contains("candidate-btn")) {
                const subjectId = event.target.dataset.id;
                if (subjectId){
                    applyForSubject(subjectId);
                }
            }
        })
    }
}

function setupStartOrContinueListener(){
    const container = document.getElementById('subjectsContainer');
    if (container){
        container.addEventListener('click',async event => {
            if (event.target.classList.contains("execute-btn")){
                const subjectId = event.target.dataset.id;
                if (subjectId){
                    await startAndGetTutorTest(subjectId);
                }
            }
        })
    }
}

async function startAndGetTutorTest(subjectId) {
    try {
        const body = {
            "subjectId": subjectId
        }
        const response = await postFunction(`${base_route}/start_test`, body);

        testToTake = response.message;
        let subjectName = testToTake.subject_name;
        alert(`Test to became tutor for ${subjectName} will start now!`);
        goTo('tutorTest')
    }
    catch (error){
        if (error.isServerError){
            alert(`Error: ${error.message}`);
        }
        else {
            console.error("Connection Error:", error)
            alert(`Impossible to connect to server or internal server error`)
        }
    }
}

function populateTestPage(){
    const container = document.getElementById('tutorTestContainer');
    container.innerHTML = `
        <div class="testHeader">
            <h2>Test for: ${testToTake.subject_name}</h2>
            <div id="timerDisplay" class="timer">00:00</div>
        </div>
        <div class="questionContainer">
        </div>
    `;
    let secondsLeft = testToTake.time_left_session;
    startTimer(secondsLeft);
    questionNavigation();
    showQuestion(0);

}

function startTimer(secondsLeft){
    const arrivalTime = Date.now()
    // formatTime is a function that I wrote inside the utils file
    // first call to display something before checking if the time displayed is correct
    document.getElementById("timerDisplay").textContent = formatTime(secondsLeft);

    /*
     * Here we set up an interval to be secure that the time showed in the frontend is right
     * we use in the async function the time left we get from the server and confront it
     * with the time at the moment of the function call so we can be sure
     * that is shown the right amount of time left to complete the test
     * this timer is refreshed every second (1000 is in milliseconds)
     */
    timerInterval = setInterval(async() => {
        const secondsPassed = Math.floor((Date.now() - arrivalTime)/1000);
        const remainingTime = secondsLeft - secondsPassed;

        // if the test has no time left we can submit the test so it can be corrected
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            const container = document.getElementById("tutorTestContainer");
            container.classList.add("disabledOverlay");

            document.getElementById("timerDisplay").textContent = "Submitting the test..."
            const message = await submitTest();

            if (message) {
                showTestFinished(message);
            }
            else {
                showTestFinished(
                    "We are sorry, there was an error with server connection during the submitting of the test");
            }
        }
        else {
            document.getElementById("timerDisplay").textContent = formatTime(remainingTime);
        }
    }, 1000);
}

function questionNavigation(){
    const navContainer = document.createElement('div');
    navContainer.className = 'navigationBar';

    testToTake.questions.forEach((dummy,index) => {
        const btn = document.createElement('button');
        btn.textContent = index +1;
        btn.className = "navigationButton";
        btn.onclick = () => showQuestion(index);
        navContainer.appendChild(btn);
    })

    const container = document.getElementById('tutorTestContainer');
    container.insertBefore(navContainer, container.querySelector(".questionContainer"));
}

function showQuestion(index) {
    currentQuestionIndex = index;
    const questionContainer = document.querySelector(".questionContainer");
    const question = testToTake.questions[index];

    const isLastQuestion = index === testToTake.questions.length - 1;
    const skipToNextBtnText = isLastQuestion ? "Return to first" : "Skip to next"
    const saveAndContinueBtnText = isLastQuestion ? "Save and return to first" : "Save and Continue"

    const savedAnswer = testToTake.user_answers.find(
        a => a.question_id === question.question_id
    )
    const selectedAnswerId = savedAnswer ? savedAnswer.answer_given : null;

    questionContainer.innerHTML = `
        <div class="questionBlock">
            <h3>Question: ${index + 1}</h3>
            <p>${question.question}</p>
            <div class="answerList">
                ${question.answers.map(answer => `
                    <label>
                        <input type="radio"
                            name="q_${question.question_id}"
                            value="${answer.answer_id}"
                            ${selectedAnswerId == answer.answer_id ? "checked" : ""}>
                        ${answer.text}
                    </label>  
                `).join('')}
            </div>
        </div>
        
        <div class="nextQuestionButtons">
            <button id="saveAndContinueBtn">${saveAndContinueBtnText}</button>
            <button id="skipToNextBtn">${skipToNextBtnText}</button>
            <button id="saveAndSubmitBtn">Save and Submit</button>
        </div>
    `;

    document.getElementById(
        "saveAndContinueBtn").onclick = () => saveAndContinue(
        question.question_id
    );

    document.getElementById(
        "skipToNextBtn").onclick = () => skipToNext();

    document.getElementById(
        "saveAndSubmitBtn").onclick = () => saveAndSubmit(
            question.question_id
        );
}

async function saveAndContinue(questionId){

    const selectedAnswer = document.querySelector(
        `input[name="q_${questionId}"]:checked`
    )
    if (!selectedAnswer) {
        alert("Can't save if an answer is not selected")
        return;
    }
    const body = {
        "subjectId": testToTake.subject_id,
        "questionId": questionId,
        "answer": parseInt(selectedAnswer.value)
    }
    try {
        await postFunction(`${base_route}/answer`,body)

        const existingAnswerIndex = testToTake.user_answers.findIndex(
            a => a.question_id === questionId
        );
        if (existingAnswerIndex !== -1) {
            testToTake.user_answers[existingAnswerIndex].answer_given= parseInt(selectedAnswer.value);
        }
        else {
            testToTake.user_answers.push({
                question_id: questionId,
                answer_given: parseInt(selectedAnswer.value)
            });
        }
        goToNextQuestion();

    }

    catch (error){
        if (error.isServerError){
            alert(`Error: ${error.message}`);
        }
        else {
            console.error("Connection Error:", error)
            alert(`Impossible to connect to server or internal server error`)
        }
    }
}

/*
 * when this function is called we save the last answer selected (if is selected)
 * than we submit the test to the server so it can be corrected
 * One thing we do in this function is disabling the save and submit button immediatly
 * to avoid (or try to prevent at least) the case which the button is erroneusly
 * clicked multiple times (this can return a false answer from the server)
 */
async function saveAndSubmit(questionId){
    const saveAndSubmitBtn = document.getElementById("saveAndSubmitBtn");
    saveAndSubmitBtn.disabled = true;
    saveAndSubmitBtn.textContent = "Submitting the test...";

    const subjectId = testToTake.subject_id;
    const selectedAnswer = document.querySelector(
        `input[name="q_${questionId}"]:checked`
    )

    try {
        if (selectedAnswer) {
            const saveBody = {
                "subjectId": subjectId,
                "questionId": questionId,
                "answer": parseInt(selectedAnswer.value)
            }

            await postFunction(`${base_route}/answer`, saveBody);
        }
        const submitBody = {
            "subjectId": subjectId
        }
        const submitResponse = await postFunction(`${base_route}/submit`, submitBody);

        showTestFinished(submitResponse.message || "Test Finished");
    }
    catch (error){
        saveAndSubmitBtn.disabled = false;
        saveAndSubmitBtn.textContent = "Save and Submit";

        if (error.isServerError){
            alert(`Error: ${error.message}`);
        }
        else {
            console.error("Connection Error:", error)
            alert(`Impossible to connect to server or internal server error`)
        }
    }
}

function skipToNext() {
    goToNextQuestion();
}

function goToNextQuestion() {
    if (currentQuestionIndex < testToTake.questions.length - 1) {
        showQuestion(currentQuestionIndex+1);
    }
    else {
        showQuestion(0);
    }
}

function showTestFinished(message){
    const container = document.getElementById('tutorTestContainer');

    container.classList.remove('disabledOverlay');

    clearInterval(timerInterval);

    container.innerHTML = `
        <div class="finishMessage">
            <h2>Test Ended!</h2>
            <br>
            <p>Result:</p>
            <p>${message}</p>
            <button id="backToMainPage">Return to main page</button>
        </div>
    `;

    document.getElementById("backToMainPage").onclick = () => goTo("main");
}

async function submitTest() {
    try {
        const body = {
            "subjectId": testToTake.subject_id
        }

        const response = await postFunction(`${base_route}/submit`, body);

        return response.message;

    }
    catch (error) {
        if (error.isServerError) {
            return (`Error: ${error.message}`);
        } else {
            console.error("Connection Error:", error)
            return (`Impossible to connect to server or internal server error`)
        }
    }
}