import { API_URL } from "../app.js";

let goTo;

//initialize the correction page
export function init(page, navigateTo) {

    if(navigateTo) {
        goTo = navigateTo;
    }
    // load test to correct and corrected tests
    if(page === "correctTests") {
        loadTestsToCorrect()
        loadCorrectedTests()

        // go back to the classroom page
        const backButton = document.getElementById("backButton");

        if(backButton) {
            backButton.addEventListener("click", function() {
                goTo("classroomTest")
            });
        }
    }
}

// load all test waiting for correction
async function loadTestsToCorrect() {

    const token = localStorage.getItem("token");

    try{
        const response = await fetch(
            `${API_URL}/api/student/tests?action=get_tests_to_correct`,
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

// Display tests that require tutor correction
async function displayTestsToCorrect(tests){

    const container = document.getElementById("testsToCorrectContainer");

    // clear previous content
    container.innerHTML = "";

    // Create a card for each submitted test
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

        // open the selected submission
        button.addEventListener("click", function () {
            localStorage.setItem("submission_id", this.dataset.id);
            goTo("correctSingleTest");
        });
    });
}

// Display all corrected tests
function displayCorrectedTests(tests) {

    const container = document.getElementById("correctedTestsContainer");

    container.innerHTML = "";

    // Create a card for each corrected test
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


// load all corrected tests
async function loadCorrectedTests() {

    const token = localStorage.getItem("token");

    try {
        // request corrected tests from backend
        const response = await fetch(
            `${API_URL}/api/student/tests?action=get_corrected_tests`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        // display corrected tests
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





