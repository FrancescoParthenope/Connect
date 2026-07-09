import { API_URL } from "../app.js";
import {displayTests} from "./displayTests.js";
import {checkIsOwner} from "./classroom.js";
import { loadSidebar } from "./utils.js";

let goTo;

export async function init(page, navigateTo) {

    if (navigateTo) {
        goTo = navigateTo;
    }

    await loadSidebar(navigateTo);

    if (page === "classroomTest") {
        linkToMain(goTo)
        linkToClassroomList(goTo)
        await loadClassroomTests();

        const backButton = document.getElementById("backButton");

        if (backButton) {
            backButton.addEventListener("click", function () {
                goTo("classroom");
            });
        }

        const correctTestsButton = document.getElementById("correctTestsButton");
        if (correctTestsButton) {
            if (await checkIsOwner()) {
                correctTestsButton.classList.remove("owner-only")
                correctTestsButton.addEventListener("click", function () {
                    goTo("correctTests")
                });
            }
        }
    }
}

export async function loadClassroomTests() {

    const token = localStorage.getItem("token");
    const classroomId = localStorage.getItem("classroomId");

    if (!token) {
        alert("You must be logged in");
        if (goTo) {
            goTo("login");
        }
        return;
    }
    if (!classroomId){
        alert("No Classroom ID found, return to classrooms home page");
        goTo("classroomHome");
    }

    try {
        const response = await fetch(
            `${API_URL}/tests?classroom_id=${classroomId}`, {
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
            await displayTests(
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
            await loadClassroomTests();
        } else {
            alert(data.message);
        }

    } catch (error) {
        console.error(error);
        alert("Impossible to connect to server");
    }
}

function linkToMain(goTo) {
    const linkToMain = document.getElementById('linkToMain');
    if (linkToMain) {
        linkToMain.addEventListener('click', event => {
            event.preventDefault();
            goTo('main');
        })
    }
}
function linkToClassroomList(goTo){
    const linkToClassroomList = document.getElementById('linkToClassroomList');
    if (linkToClassroomList){
        linkToClassroomList.addEventListener('click', event => {
            event.preventDefault();
            goTo('classroomHome');
        })
    }
}