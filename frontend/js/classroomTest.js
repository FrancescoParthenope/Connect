import { API_URL } from "../app.js";
import {displayTests} from "./displayTests.js";

let goTo;

// initialize the classroom test page
export function init(page, navigateTo){

    const user = JSON.parse(localStorage.getItem('user'));
    const role = user.roles[0]

    if(navigateTo){
        goTo = navigateTo;
    }
    // load all classroom tests when the page is opened
    if(page === "classroomTest"){
        loadClassroomTests();

        // Go back to the main page
        const backButton = document.getElementById("backButton");

        if(backButton){
            backButton.addEventListener("click", function(){
                goTo("main")
            });
        }

        // show the correction button only for tutors
        if(correctTestsButton){
            if(role === "tutor"){
                correctTestsButton.style.display = "inline-block";
                correctTestsButton.addEventListener("click", function(){
                    goTo("correctTests")
                });
            }else{
                correctTestsButton.style.display = "none";
            }
        }
    }
}

// load classroom test and student submissions
async function loadClassroomTests() {

    const token = localStorage.getItem("token");

    if (!token) {
        alert("You must be logged in");
        if (goTo) {
            goTo("login");
        }
        return;
    }

    try {
        // request classroom tests
        const response = await fetch(
            `${API_URL}/tests?classroom_id=507f1f77bcf86cd799439011`, {
                method: "GET",
                headers: {"Authorization": `Bearer ${token}`}
            });

        // request completed student tests
        const responseStudent = await fetch(`${API_URL}/student/tests?action=get_student_test`, {
            method: "GET",
            headers: {"Authorization": `Bearer ${token}`}
        });

        const testsData = await response.json();
        const studentsData = await responseStudent.json();

        if (response.ok && responseStudent.ok) {
            displayTests(
                testsData.data,
                studentsData.data,
                goTo,
                toggleTest
            );
        } else {
            alert("Error loading test");
        }

    } catch (error) {
        console.error(error);
        alert("Impossible to connect to server");
    }
}

// Activate or deactivate a test
async function toggleTest(testId, currentStatus) {

    const token = localStorage.getItem("token");

    try {
        // send the new activation status to the backend
        const response = await fetch(`${API_URL}/tests`, {
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