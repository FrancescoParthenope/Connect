import { API_URL } from "../app.js";
import { loadSidebar } from "./utils.js";

let goTo;

export async function init(page, navigateTo){

    if(navigateTo){
        goTo = navigateTo;
    }

    await loadSidebar(navigateTo);

    if(page === "viewTest"){
        loadTest();

        const backButton = document.getElementById("backButton");

        if(backButton){
            backButton.addEventListener("click", function(){
                goTo("classroomTest")
            });
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

    try{
        const response = await fetch(
            `${API_URL}/tests?test_id=${testId}`,
            {
                method: "GET",
                headers:{"Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();
        console.log(data);

        if(response.ok){
            displayTest(data.data);
        }else{
            alert(data.message);
        }

    }catch(error){
        console.error(error);
        alert("Impossible to connect to server");
    }
}

function displayTest(test){
    document.getElementById("testTitle").textContent = test.title;
    document.getElementById("timeLimit").textContent = test.time_limit + " minutes";

    const container = document.getElementById("questionsContainer");

    container.innerHTML = "";

    test.questions.forEach((question, index)=>{
        const div = document.createElement("div");
        let answersHtml = "";

        if(question.question_type === "multiple_choice"){
            question.answers.forEach(answer=>{
                answersHtml += `<p>• ${answer.text}</p> `;
            });
        }else{
            answersHtml = `<p><i>Open Question</i></p>`;
        }

        div.innerHTML = `
            <hr>
            <h3>
                Question ${index + 1}
            </h3>
            <p>${question.question}</p>
            ${answersHtml}
        `;
        container.appendChild(div);
    });
}