import {API_URL} from "../app.js";
import { loadSidebar, populateSelectField } from "./utils.js";

let goTo;
let subjectsList = [];
let tutorList = [];

export async function init(page, navigateTo) {

    if (navigateTo) {
        goTo = navigateTo;
    }

    await loadSidebar(navigateTo);

    if (page === "searchBySubject"){
        linkToMain();
        await loadSubjects();
        const subjectSearch = document.getElementById("subjectSearch");
        const fieldSelection = document.getElementById("fieldSelection");
        const tutorContainer = document.getElementById("tutorContainer");
        fieldSelection.addEventListener("change", () => {
            subjectSearch.value = "";
            tutorContainer.innerHTML ="";
            subjectsDropDownList();
        });
        subjectSearch.addEventListener("input", () => {
            tutorContainer.innerHTML = "";
            subjectsDropDownList();
        });
        subjectsDropDownList();

        const backButton = document.getElementById("backButton");
        if (backButton) {
            backButton.addEventListener("click", () => {
                goTo("dashboard_home");
            })
        }
    }
}

function linkToMain() {
    const linkToMain = document.getElementById('linkToMain');
    if (linkToMain) {
        linkToMain.addEventListener('click', event => {
            event.preventDefault();
            goTo('main');
        })
    }
}

async function loadSubjects() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/subjects/all_subjects`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })

        const data = await response.json();

        if (response.ok) {
            subjectsList = data.message;
            populateSelectField("fieldSelection",subjectsList);
        }
        else {
            alert(`Error: ${data.message}`);
        }
    }

    catch (error) {
        console.error("Connection Error:", error)
        alert(`Impossible to connect to server`)
    }
}

function subjectsDropDownList() {
    const field = document.getElementById("fieldSelection").value;
    const query = document.getElementById("subjectSearch").value.toLowerCase();
    const dropdown = document.getElementById("subjectResults");

    dropdown.innerHTML = '';

    const filteredSubjects = subjectsList.filter( s => {
        const fieldFilter = (field === "all" || s.field === field);
        const queryFilter = s.name.toLowerCase().includes(query);
        return fieldFilter && queryFilter;
    });

    if (filteredSubjects.length > 0){
        dropdown.style.display = "block";

        filteredSubjects.forEach(subject => {
            const item = document.createElement("button");
            item.className = "subject-item";
            item.textContent = subject.name;

            item.addEventListener("click", async (event) => {
                event.preventDefault();
                document.getElementById("subjectSearch").value = subject.name;
                dropdown.style.display = "none";
                let loaded = await loadTutorList(subject.name);
                if (loaded) {
                    showTutorList();
                }
            });

            dropdown.appendChild(item);
        });
    }
    else {
        dropdown.style.display = "none";
    }
}

async function loadTutorList(subject){
    try {
        const token = localStorage.getItem('token');
        const url = `${API_URL}/search_tutors?subject=${encodeURIComponent(subject)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok){
            tutorList = data.message;
            return true;
        }
        else {
            return false;
        }
    }
    catch (error) {
        console.error("Connection Error:", error)
        alert(`Impossible to connect to server`)
    }
}

function showTutorList(){
    const container = document.getElementById('tutorContainer');
    container.innerHTML = '';
    tutorList.forEach(tutor => {
        const card = document.createElement("div");
        let profile_picture = tutor.profile_picture || "img/default_picture.png";
        card.className = "tutor-card";
        card.innerHTML = `
            <h3>${tutor.first_name} ${tutor.last_name} 
                <img 
                class="profile-picture" 
                src="${profile_picture}"
                alt="profile picture"
                width="65"
                height="65"/>
            </h3>
            <div class="profile-description">
                <p>${tutor.tutor_profile.description}</p>
            </div>
            <p>Email : ${tutor.email}</p>
            <p>Average rating: ${tutor.tutor_profile.average_rating}, Reviews: ${tutor.tutor_profile.reviews_count}</p>
        `;
        card.addEventListener("click", async event => {
            event.preventDefault();
            await openTutorChat(tutor);
        })
        container.appendChild(card);
    })
}

async function openTutorChat(tutor) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(
            `${API_URL}/chat?action=get_private_conversations&email=${tutor.email}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (data.success) {

            localStorage.setItem("conversation_id", data.message._id);
            localStorage.setItem("conversation_title", `${tutor.first_name} ${tutor.last_name}`);
            goTo("chat");
        } else {
            alert(data.message || "error retrieving chat");
        }
    } catch (error) {
        console.error(error);
        alert("Impossible to connect to server");
    }
}