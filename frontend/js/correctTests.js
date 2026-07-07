import { API_URL } from "../app.js";

let goTo;

export function init(page, navigateTo) {

    if(navigateTo) {
        goTo = navigateTo;
    }
    if(page === "correctTests") {
        loadTestsToCorrect()
        loadCorrectedTests()

        const backButton = document.getElementById("backButton");

        if(backButton) {
            backButton.addEventListener("click", function() {
                goTo("classroomTest")
            });
        }
    }
}

async function loadTestsToCorrect() {

    const token = localStorage.getItem("token");

    try{
        const response = await fetch(
            `${API_URL}/student/tests?action=get_tests_to_correct`,
            {
                method: "GET",
                headers:{"Authorization": `Bearer ${token}`
                }

            }
        );
        const data = await response.json();

        if(response.ok){
            console.log(data)
            displayTestsToCorrect(data.data);
        }else{
            alert(data.message);
        }
    }catch(error){
        console.log(error)
        alert("Impossible to connect to the server");
    }
}

async function displayTestsToCorrect(tests){

    const container = document.getElementById("testsToCorrectContainer");
    container.innerHTML = "";

    tests.forEach(test => {
        const div = document.createElement("div");

        div.innerHTML = `
            <hr>
            <h3>${test.title}</h3>
            <p><strong>Student:</strong> ${test.student_name}</p>
            <p><strong>Submitted:</strong>
                ${new Date(test.completed_date).toLocaleString("it-IT")}
            </p>
            <button
                class="correctButton"
                data-id="${test.submission_id}">
                Correct Test
            </button>
        `;
        container.appendChild(div);

        const button = div.querySelector(".correctButton");

        button.addEventListener("click", function () {
            localStorage.setItem("submission_id", this.dataset.id);
            goTo("correctSingleTest");
        });
    });
}

function displayCorrectedTests(tests) {

    const container = document.getElementById("correctedTestsContainer");

    container.innerHTML = "";

    tests.forEach(test => {
        const div = document.createElement("div");

        div.innerHTML = `
            <hr>
            <h3>${test.title}</h3>
            <p><strong>Student:</strong> ${test.student_name}</p>
            <p><strong>Submitted:</strong>
                ${new Date(test.completed_date).toLocaleString("it-IT")}
            </p>
            <p><strong>Final Score:</strong> ${test.score}</p>
            <p><strong>Status:</strong> ${test.status}</p>
        `;

        container.appendChild(div);
    });
}

async function loadCorrectedTests() {

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(
            `${API_URL}/student/tests?action=get_corrected_tests`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.ok) {
            displayCorrectedTests(data.data);
        } else {
            alert(data.message);
        }

    } catch (error) {
        console.error(error);
        alert("Impossible to connect to the server");
    }
}





