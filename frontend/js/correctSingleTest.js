import { API_URL } from "../app.js";

let goTo

export async function init(page, navigateTo){
    if(navigateTo){
        goTo = navigateTo;
    }

    if(page === "correctSingleTest"){
        await loadSubmission();

        const backButton = document.getElementById("backButton");
        if(backButton){
            backButton.addEventListener("click", function(){
                goTo("correctTests");
            });
        }

        const saveButton = document.getElementById("saveCorrectionButton");
        if(saveButton){
            saveButton.addEventListener("click", saveCorrection);
        }
    }
}

async function loadSubmission(){

    const token = localStorage.getItem("token");
    const submissionId = localStorage.getItem("submission_id");

    try{
        const response = await fetch(

            `${API_URL}/student/tests?action=get_submission&submission_id=${submissionId}`,
            {
                method: "GET",
                headers:{"Authorization": `Bearer ${token}`

                }
            }
        );

        const data = await response.json();
        if(response.ok){
            displaySubmission(data.data);
        }else{
            alert(data.message);
        }

    }catch(error){
        console.error(error);
        alert("Impossible to connect to server");
    }
}

function displaySubmission(submission){
    const container = document.getElementById("submissionContainer");

    container.innerHTML = `
        <h3>${submission.title}</h3>
        <p><strong>Student:</strong> ${submission.student_name}</p>
        <p><strong>Submitted:</strong>
            ${new Date(submission.completed_date).toLocaleString("it-IT")}
        </p>
        <hr>
    `;

    submission.questions.forEach((question, index) => {
        container.innerHTML += `
        <h4>Question ${index + 1}</h4>
        <p>
            <strong>Question:</strong><br>
            ${question.question_text}
        </p>
        <p>
            <strong>Student Answer:</strong><br>
            ${question.given_answer_text}
        </p>
        <p>
            <strong>Assigned Score:</strong>
        </p>
        <input
            type="number"
            class="scoreInput"
            data-question="${index}"
            value="${question.score_assigned ?? ""}"
            min="0">
        <hr>
        `;
    })
}

async function saveCorrection(){

    const input = document.querySelectorAll(".scoreInput");
    const token = localStorage.getItem("token");
    const submissionId = localStorage.getItem("submission_id");

    const questions = [];

    input.forEach(input => {
        questions.push({
            index: Number(input.dataset.question),
            score: Number(input.value)
        });
    });

    const status = document.querySelector('input[name="result"]:checked').value;

    try {
        const response = await fetch(
            `${API_URL}/student/tests`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: "save_correction",
                    submission_id: submissionId,
                    questions: questions,
                    status: status
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            alert("Correction saved successfully!");
            goTo("correctTests");
        } else {
            alert(data.message);
        }

    } catch (error) {
        console.error(error);
        alert("Impossible to connect to server");
    }
}