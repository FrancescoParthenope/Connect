import {API_URL} from "../app.js";

let globalRefreshInterval = null;

export function formatTime(secondsLeft){
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    return `${minutes} minutes and ${seconds.toString().padStart(2, '0')} seconds left`
}
/*
route must be a string that completes the route after the "api"
so to complete right the route must be something like "/name_of_action".
body is an object for the JSON.stringify
 */
export async function postFunction(route,body){
    const token = localStorage.getItem('token');

    const response =  await fetch(`${API_URL}/${route}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });
    const data = await response.json();

    if (!response.ok){
        const error = new Error(data.message || "Something went wrong");
        error.isServerError = !!data.message;
        error.data = data;
        throw error;
    }

    return data;
}

/**
 * this function is put here so we can populate
 * an HTML select element (we pass to the function the ID of the element)
 * with the fields of the elements passed in subjectsList
 * this way we can reuse this function when needed in other .js files
 */
export function populateSelectField(idElement,subjectsList){
    const fieldSelection = document.getElementById(idElement);
    if (fieldSelection){
        fieldSelection.innerHTML = '<option value ="all" selected>All</option>';

        // extracting the elements in the field camp in the JSON type returned from server
        // using Set to eliminate duplicates of the fields
        // .map to indicate the element to extract
        // ... spread operator used to get the single field extracted

        const fields = [... new Set(subjectsList.map(s => s.field))]

        // no\w that we have the array with the right fields, we populate the options

        fields.forEach(field => {
            const option = document.createElement("option");
            option.value = field;
            option.textContent = field;
            fieldSelection.appendChild(option);
        });
    }
}

export function setRefreshInterval(callback, ms) {
    clearChatInterval();
    globalRefreshInterval = setInterval(callback, ms);
}

export function clearChatInterval() {
    if (globalRefreshInterval) {
        clearInterval(globalRefreshInterval);
        globalRefreshInterval = null;
    }
}

export function linkToMain(goTo) {
    const linkToMain = document.getElementById('linkToMain');
    if (linkToMain) {
        linkToMain.addEventListener('click', event => {
            event.preventDefault();
            goTo('dashboard_home');
        })
    }
}
export function linkToClassroomList(goTo){
    const linkToClassroomList = document.getElementById('linkToClassroomList');
    if (linkToClassroomList){
        linkToClassroomList.addEventListener('click', event => {
            event.preventDefault();
            goTo('classroomHome');
        })
    }
}


export async function loadSidebar(goTo){
    const container = document.getElementById("sidebarContainer");

    if (!container){
        return;
    }

    const response = await fetch("views/component/sidebar.html");

    if (!response.ok){
        throw new Error("Impossible to load sidebar");
    }

    document.getElementById("sidebarContainer").innerHTML = await response.text();

    document.getElementById("linkToDashboardHome")?.addEventListener("click", (event) => {
        event.preventDefault();
        goTo("dashboard_home");
    });

    document.getElementById("linkToProfile")?.addEventListener("click", (event) => {
        event.preventDefault();
        goTo("update_profile");
    });

    document.getElementById("linkToChat")?.addEventListener("click", (event) => {
        event.preventDefault();
        goTo("chats");
    });

    document.getElementById("linkToSearchBySubject")?.addEventListener("click", (event) => {
        event.preventDefault();
        goTo("searchBySubject");
    });

    document.getElementById("linkToBecomeTutor")?.addEventListener("click", (event) => {
        event.preventDefault();
        goTo("becomeTutor");
    })

    document.getElementById("linkToClassrooms")?.addEventListener("click", (event) => {
        event.preventDefault();
        goTo("classroomHome");
    })

    document.getElementById("linkToClassroomHome")?.addEventListener("click", (event) => {
        event.preventDefault();
        goTo("classroomHome");
    })

    document.getElementById("linkToInsertPayments")?.addEventListener("click", (event) => {
        event.preventDefault();
        goTo("insert_payments");
    });

    document.getElementById("reviewLink")?.addEventListener("click", (event) => {
        event.preventDefault();
        goTo("viewReview");
    });

    document.getElementById("linkToReviewPage")?.addEventListener("click", (event) => {
        event.preventDefault();
        goTo('reviewPage');
    })

    document.getElementById("linkToLogout")?.addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        goTo("login");
    });
}
