import { API_URL } from "../app.js";

let goTo;

// initialize the test view page for tutor after the creation the test
export function init(page, navigateTo){

    if(navigateTo){
        goTo = navigateTo;
    }
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

// load the selected test
async function loadTest(){

    // Check if the user is authenticated
    const token = localStorage.getItem("token");

    if(!token){
        alert("You must be logged in");
        if(goTo){
            goTo("login");
        }
        return;
    }

    // get the selected test id
    const testId = localStorage.getItem("test_id");
    console.log("TEST ID:", testId);

    try{
        // request test details from the backend
        const response = await fetch(
            `${API_URL}/api/tests?test_id=${testId}`,
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

// Display the selected tests
function displayTest(test){

    // Display basic test information
    document.getElementById("testTitle").textContent = test.title;
    document.getElementById("timeLimit").textContent = test.time_limit + " minutes";

    const container = document.getElementById("questionsContainer");

    // clear previous questions
    container.innerHTML = "";

    // display all test questions
    test.questions.forEach((question, index)=>{
        const div = document.createElement("div");
        let answersHtml = "";

        // Display answer options for multiple choice questions
        if(question.question_type === "multiple_choice"){
            question.answers.forEach(answer=>{
                answersHtml += `<p>• ${answer.text}</p> `;
            });
            // display open question label
        }else{
            // create the question card
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
        // Add the question to the page
        container.appendChild(div);
    });
}