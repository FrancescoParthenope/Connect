import { API_URL } from "../app.js";

let goTo;
let currentTest = null
let timerInterval = null;

export function init(page, navigateTo){

    if(navigateTo){
        goTo = navigateTo;
    }
    if(page === "startTest"){
        loadTest();
        const submitButton = document.getElementById("submitTestButton");
        if(submitButton){
            submitButton.addEventListener("click", submitTest);
        }
    }
}

async function loadTest(){
    const token = localStorage.getItem("token");
    if(!token){
        alert("You must be logged in");
        if(goTo){
            goTo("login");
        }
        return;
    }

    const testId = localStorage.getItem("test_id");

    console.log("TEST ID: ", testId);
    console.log("Invio richiesta start test...");

    try{
        const response = await fetch(`${API_URL}/api/student/tests`,{

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

        console.log("status: ", response.status);
        const data = await response.json();
        console.log("Risp backend:", data);

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

function displayTest(test){

    currentTest = test;

    document.getElementById("testTitle").textContent = test.title;
    startTimer(test.time_limit);

    const container = document.getElementById("questionsContainer");
    container.innerHTML = "";

    test.questions.forEach((question, index) => {

        const div = document.createElement("div");

        let answersHtml = "";

        if(question.question_type === "multiple_choice"){
            question.answers.forEach(answer => {
                answersHtml += `
                    <label>
                        <input
                            type="radio"
                            name="question_${index}"
                            value="${answer.answer_id}">
                        ${answer.text}
                    </label>
                    <br>
                `;
            });

        }else{
            answersHtml = `
                <textarea
                    id="question_${index}"
                    rows="5"
                    cols="60"
                    placeholder="Write your answer here...">
                </textarea>
           `;
        }

        div.innerHTML = `
            <hr>
            <h3>Question ${index + 1}</h3>
            <p>${question.question}</p>
            ${answersHtml}
        `;
        container.appendChild(div);
    });
}


function startTimer(minutes){
    let timeLeft = minutes * 60;

    timerInterval = setInterval(() => {
        const minutesLeft = Math.floor(timeLeft / 60);
        const secondsLeft = timeLeft % 60;
        document.getElementById("timer").textContent = `${minutesLeft}:${secondsLeft.toString().padStart(2, "0")}`;

        if(timeLeft <= 0){
            clearInterval(timerInterval);
            alert("Time is over!");
            submitTest();
        }
        timeLeft--;
    }, 1000);
}


function buildAnswers(test){

    const answers = [];

    test.questions.forEach((question, index) => {
        const answer = {question_id: question.question_id};

        console.log(question);

        if(question.question_type === "multiple_choice"){
            const selected = document.querySelector(`input[name="question_${index}"]:checked`);
            if(selected){
                answer.given_answer_id = Number(selected.value);
            }else{
                answer.given_answer_id = null;
            }
        }else{
            answer.given_answer = document.getElementById(`question_${index}`).value.trim();
        }
        answers.push(answer);

        console.log("QUESTION:", answer);
        console.log("QUESTION ID INVIATO:", answer.question_id);

    });

    return answers;
}


async function submitTest(){

    alert("Submitting...");

    const token = localStorage.getItem("token");

    if(!token){
        alert("You must be logged in");
        if(goTo){
            goTo("login");
        }
        return;
    }

    const answers = buildAnswers(currentTest);
    console.log({
        action: "submit_test",
        test_id: currentTest.test_id,
        answers: answers
    });

    try{
        const response = await fetch(`${API_URL}/api/student/tests`, {
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
            clearInterval(timerInterval);
            alert("Test submitted successfully");
        }else{
            alert(data.message);
        }

    }catch(error){
        console.error(error);
        alert("Impossible to connect to server");
    }
}
