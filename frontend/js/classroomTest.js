import { API_URL } from "../app.js";

let goTo;

export function init(page, navigateTo){
    if(navigateTo){
        goTo = navigateTo;
    }
    if(page === "classroomTest"){
        loadClassroomTests();
    }
}

async function loadClassroomTests(){

    const token = localStorage.getItem("token");

    if(!token){
        alert("You must be logged in");
        if(goTo){
            goTo("login");
        }
        return;
    }

    try{
        const response = await fetch(
            `${API_URL}/api/tests?classroom_id=507f1f77bcf86cd799439011`, {method: "GET", headers: {"Authorization": `Bearer ${token}`}});

        const data = await response.json();

        if(response.ok){
            console.log(data);
            displayTests(data.data);
        }else{
            alert(data.message);
        }

    }catch(error){
        console.error(error);
        alert("Impossible to connect to server");
    }
}

function displayTests(tests){

    const container = document.getElementById("testsContainer");
    container.innerHTML = "";

    const user = JSON.parse(localStorage.getItem("user"));
    const role = user.roles[0];

    tests.forEach(test => {

        if(role === "student" && !test.is_active){
            return;
        }

        let buttonHtml = "";
        if (role === "tutor") {
            buttonHtml = `
                <button
                    class="toggleButton"
                    data-id="${test.test_id}"
                    data-active="${test.is_active}">
                    ${test.is_active ? "Deactivate" : "Activate"}
                </button>
            `;
        } else {
            if (test.is_active) {
                buttonHtml = `
                    <button
                        class="startButton"
                        data-id="${test.test_id}">
                        Start Test
                    </button>
                `;
            }
        }

        const div = document.createElement("div");

        div.innerHTML = `
            <hr>
            <h3>${test.title}</h3>
            <p>Time limit: ${test.time_limit} minutes</p>
            <p>Status: ${test.is_active ? "Active" : "Inactive"}
            </p>
          ${buttonHtml}
        `;
        container.appendChild(div);

        if (role === "tutor") {

            const button = div.querySelector(".toggleButton");

            button.addEventListener("click", function () {
                toggleTest(this.dataset.id, this.dataset.active === "true");
            });
        } else {
            const button = div.querySelector(".startButton");
            if (button) {
                button.addEventListener("click", function () {
                localStorage.setItem("test_id", this.dataset.id);
                goTo("startTest");
                });
            }
        }
    });
}

async function toggleTest(testId, currentStatus) {

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_URL}/api/tests`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                action: "toggle_test",
                test_id: testId,
                is_active: !currentStatus
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            loadClassroomTests();
        } else {
            alert(data.message);
        }

    } catch (error) {
        console.error(error);
        alert("Impossible to connect to server");
    }
}

export {loadClassroomTests};