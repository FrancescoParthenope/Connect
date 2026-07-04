import { API_URL } from "../app.js";
import {displayTests} from "./displayTests.js";

let goTo;

export function init(page, navigateTo){

    const user = JSON.parse(localStorage.getItem('user'));
    const isTutor = user.roles.includes("tutor");

    if(navigateTo){
        goTo = navigateTo;
    }

    if(page === "classroomTest"){
        loadClassroomTests();

        const backButton = document.getElementById("backButton");

        if(backButton){
            backButton.addEventListener("click", function(){
                goTo("main")
            });
        }

        if(correctTestsButton){
            if(isTutor){
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
        const response = await fetch(
            `${API_URL}/tests?classroom_id=507f1f77bcf86cd799439011`, {
                method: "GET",
                headers: {"Authorization": `Bearer ${token}`}
            });

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

async function toggleTest(testId, currentStatus) {

    const token = localStorage.getItem("token");

    try {
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