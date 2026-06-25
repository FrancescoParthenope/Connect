import {API_URL} from "../app.js";

let goTo;

let subjects = [];

export function init(page, navigateTo){
    if (navigateTo)
        goTo = navigateTo;

    if (page === 'eligibleSubjects'){
        const linkToMain = document.getElementById('linkToMain');
        if (linkToMain) {
            linkToMain.addEventListener('click', event => {
                event.preventDefault();
                goTo("main")
            });
        }
        const fieldSelection = document.getElementById('fieldSelection')
        if (fieldSelection) {
            fieldSelection.addEventListener('change', event => {
                filterSubjects(event.target.value);
            })
        }
        getEligibleSubjects();
    }
}

async function getEligibleSubjects() {
    try {
        let token = localStorage.getItem('token');
        const response = await fetch (`${API_URL}/api/tutor_tests/eligible_subjects`,{
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
                }
        });

        const data = await response.json();

        if (response.ok){
            subjects = data.message;
            populateSelect();
            filterSubjects("all");
        }
    }

    catch (error) {
        console.error("Connection Error:", error)
        alert(`Impossible to connect to server`)
    }
}

function populateSelect(){
    const fieldSelection = document.getElementById("fieldSelection");
    if (fieldSelection){
        fieldSelection.innerHTML = '<option value ="all" selected>All</option>';

        // extracting the elements in the field camp in the JSON type returned from server
        // using Set to eliminate duplicates of the fields
        // .map to indicate the element to extract
        // ... spread operator used to get the single field extracted

        const fields = [... new Set(subjects.map(s => s.field))]

        // now that we have the array with the right fields, we populate the options

        fields.forEach(field => {
            const option = document.createElement("option");
            option.value = field;
            option.textContent = field;
            fieldSelection.appendChild(option);
        });
    }
}

function filterSubjects(selectedField){
    const container = document.getElementById('subjectsContainer');
    container.innerHTML = ''; // clearing the container
    // selecting all subjects if all, else subjects for the field
    const filtered = (selectedField === 'all') ?
        subjects : subjects.filter(s => s.field === selectedField);

    // putting the card on screen
    filtered.forEach(subject => {
        const card = document.createElement("div");
        card.className = "subjectCard";
        card.innerHTML = `<h3>${subject.name}</h3><button>Candidate</button>`;
        container.appendChild(card);
    });
}