import {API_URL} from "../app.js";
import {postFunction,populateSelectField,
    setRefreshInterval,linkToMain,linkToClassroomList} from "./utils.js"
import {getMySubjectsList} from "./subject.js";
import {sendMessage,loadMessages} from "./chat.js"

let goTo;

let creator = null;
let classroomInfo = null;
let classroomList = [];
let subjectsList = [];
let usersInClassroom = [];
let usersNotInClassroom = [];

let classroomHomeListenerDocumentActive = false;

const baseRoute = "classroom";

export async function init(page, navigateTo){
    if (navigateTo){
        goTo = navigateTo;
    }

    if (page === "classroomHome"){
        linkToMain(goTo);
        checkUserRole();
        await getClassroomList();
        initClassroomHomeListeners();
        await inviteContainerInit();
    }

    if (page === "createClassroom"){
        linkToMain(goTo);
        linkToClassroomList(goTo);
        await loadSubjects();
        initCreateClassroomListeners();
        populateDataList();
    }

    if (page === "inviteInClassroom"){
        linkToMain(goTo);
        linkToClassroomList(goTo);
        linkToClassroomHome();
        initEmailFilterListener();
        await populateUserClassroomList();
        await populateStudentCards(usersNotInClassroom);
    }

    if (page === 'classroom'){
        linkToMain(goTo);
        linkToClassroomList(goTo);
        await checkClassroomOwner();
        await populateUserClassroomList();
        initClassroomListeners();
        populateMemberList();
        await loadClassroomChat();
    }

    if (page === "editClassroom"){
        linkToMain(goTo);
        linkToClassroomList(goTo);
        linkToClassroomHome();
        await loadSubjects();
        populateDataList();
        await loadClassroomInfo();
        await preloadForm();
        initEditClassroomListeners();
    }
}

async function inviteContainerInit(){
    const invitationTextBox = document.getElementById('invitationTextBox');
    const sendInvitationCode = document.getElementById('sendInvitationCode');
    sendInvitationCode.disabled = true;
    if (invitationTextBox && sendInvitationCode) {
        invitationTextBox.addEventListener('input', event => {
            const value = event.target.value;
            sendInvitationCode.disabled = value.length !== 6
        })
        sendInvitationCode.addEventListener('click', event => {
            event.preventDefault();
            sendCode(invitationTextBox.value);
            invitationTextBox.value = '';
            sendInvitationCode.disabled = true;
            populateClassroomListContainer();
        })
    }
}

async function sendCode(code){
    try {
        const body = {
            "inviteCode": code
        }

        const response = await postFunction(`${baseRoute}/add`, body);
        alert(response.message);
        await getClassroomList();
        populateClassroomListContainer();
    }
    catch (error){
        if (error.isServerError){
            alert(`Error: ${error.message}`);
        }
        else {
            console.error("Connection Error:", error)
            alert(`Impossible to connect to server or internal server error`)
        }
    }
}

async function getClassroomList(){
    try{
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/${baseRoute}/list`,{
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (response.ok){
            classroomList = data.message;
            populateClassroomListContainer();
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

function populateClassroomListContainer(){
    const classroomListContainer = document.getElementById('classroomListContainer');
    const classroomCreatedList = document.getElementById('classroomCreatedList');
    const userInfo = getUserInfo();

    if (classroomListContainer && classroomCreatedList) {
        classroomListContainer.innerHTML = "";
        classroomCreatedList.innerHTML = "";

        const myClassroomTitle = document.createElement("h3");
        myClassroomTitle.textContent = "My Classrooms:"
        classroomCreatedList.appendChild(myClassroomTitle);

        const joinedClassroomTitle = document.createElement("h3");
        joinedClassroomTitle.textContent = "Joined classroom:"
        classroomListContainer.appendChild(joinedClassroomTitle);

        classroomList.forEach(classroom => {
            let isOwner = false;
            if (userInfo!== null){
                isOwner = (classroom.creator.creator_name === userInfo.first_name &&
                    classroom.creator.creator_last_name === userInfo.last_name);
            }
            const isClosed = (
                (!isOwner && classroom.classroom_status === "closed") ?
                    "is-closed" : ""
            );
            const card = document.createElement('div');
            card.className = 'classroomCard';
            card.dataset.id = classroom._id;
            card.innerHTML = `
            <h3>${classroom.name}</h3>
            <br>
            <button class="enter-btn ${isClosed}" >Enter</button>
            <p>Creator: ${classroom.creator.creator_name} ${classroom.creator.creator_last_name}</p>
            <p>Subject: ${classroom.subject.subject_name}</p>
            `;

            if (isOwner) {
                classroomCreatedList.appendChild(card);
                classroomCreatedList.appendChild(document.createElement("hr"));
            } else {
                classroomListContainer.appendChild(card);
                classroomListContainer.appendChild(document.createElement("hr"));
            }
        })
    }
}

function checkUserRole(){
    const userInfo = localStorage.getItem('user');
    if (!userInfo){
        return;
    }
    try {
        const user = JSON.parse(userInfo);
        if (user.roles && user.roles.includes("tutor")) {
            const tutorElements = document.querySelectorAll(".tutor-only");

            tutorElements.forEach(htmlElement => {
                htmlElement.classList.remove('tutor-only');
            })
        }
    }
    catch (error) {
        console.error("Error during parsing user info:", error)
    }
}

async function checkClassroomOwner(){
    let userInfo = localStorage.getItem('user');
    if (!userInfo){
        return;
    }
    try {
        userInfo = JSON.parse(userInfo);
        await populateUserClassroomList();

        if (creator.email === userInfo.email) {
            const ownerElements = document.querySelectorAll(".owner-only");
            ownerElements.forEach(htmlElement => {
                htmlElement.classList.remove('owner-only');
            });
        }
    }
    catch (error) {
        console.error("Error during parsing user info:", error)
    }
}

function getUserInfo(){
    const userInfo = localStorage.getItem('user');
    if (!userInfo) {
        return null;
    }
    try {
        return JSON.parse(userInfo);
    }
    catch (error){
        console.error("Error during parsing user info:", error)
    }
}

async function loadSubjects(){
    try{
        subjectsList = await getMySubjectsList()
        populateSelectField("fieldSelection",subjectsList);
    }
    catch(error){
        console.error("Connection Error:", error)
        alert(`Impossible to connect to server`)
    }
}

function populateDataList(){
    const field = document.getElementById("fieldSelection").value;
    const query = document.getElementById("subjectInput").value.toLowerCase();

    const dataList = document.getElementById("subjectsList");
    dataList.innerHTML = "";

    const filtered = subjectsList.filter(s =>{
        const fieldFilter = (field === "all" || s.field === field);
        const queryFilter = s.name.toLowerCase().includes(query);
        return fieldFilter && queryFilter;
    });

    if (filtered.length > 0){
        filtered.forEach(subject => {
            const newOption = document.createElement("option");
            newOption.className = "subject-option";
            newOption.textContent = subject.name;
            dataList.appendChild(newOption);
        });
    }
}

function initCreateClassroomListeners(){
    const form = document.getElementById("createClassroomForm");
    genericClassroomFormListeners()

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const formInfo = new FormData(form);
        const body = {
            "classroomName": formInfo.get("classroomName"),
            "subjectName": formInfo.get("subjectInput"),
            "description": formInfo.get("classDescription")
        };
        try {
            const response = await postFunction(`${baseRoute}/create`, body);
            const responseMessage = response.message.message;
            const responseId = response.message.classroom_id;
            localStorage.setItem('classroomId', responseId);
            alert(responseMessage);
            goTo('inviteInClassroom');
        }
        catch (error) {
            if (error.isServerError) {
                alert(`Error: ${error.message}`);
            } else {
                console.error("Connection Error:", error);
                alert(`Impossible to connect to server or internal server error`);
            }
        }
    });
}

function initEditClassroomListeners(){
    const form = document.getElementById("editClassroomForm");
    genericClassroomFormListeners();

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const formInfo = new FormData(form);
        const body = {
            "classroomId": localStorage.getItem('classroomId'),
            "name": formInfo.get("classroomName"),
            "subject_name": formInfo.get("subjectInput"),
            "description": formInfo.get("classDescription"),
            "classroom_status": formInfo.get("status")
        };
        try {
            const response = await postFunction(`${baseRoute}/update`, body);
            const responseMessage = response.message;
            alert(responseMessage);
            if (body.classroom_status === "deleted"){
                goTo('classroomHome')
            }
            else {
                goTo('classroom');
            }
        }
        catch (error) {
            if (error.isServerError) {
                alert(`Error: ${error.message}`);
            } else {
                console.error("Connection Error:", error);
                alert(`Impossible to connect to server or internal server error`);
            }
        }
    });
}

async function populateUserClassroomList(){
    try {
        const token = localStorage.getItem('token');
        const classroomId = localStorage.getItem('classroomId');
        if (classroomId === null) {
            throw new Error("No classroomId in local storage");
        }

        const response = await fetch(
            `${API_URL}/${baseRoute}/memberlist?classroomId=${classroomId}`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

        const data = await response.json();

        const message = data.message;
        creator = message.creator;

        usersInClassroom = message.members;

        const all_users_response = await fetch(
            `${API_URL}/users`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

        const user_info = await all_users_response.json();

        const all_users_list = user_info.message;
        const emailsClassroomUser = new Set(usersInClassroom.map(u => u.email));
        emailsClassroomUser.add(creator.email);
        usersNotInClassroom = all_users_list.filter(
            user => !emailsClassroomUser.has(user.email));
    }
    catch (error) {
        if (error.isServerError){
            alert(`Error: ${error.message}`);
        }
        else {
            console.error("Connection Error:", error)
            alert(`Impossible to connect to server or internal server error`)
        }
    }
}

async function populateStudentCards(userList) {
    const container = document.getElementById("studentCards");
    if(container){
        container.innerHTML ="";
        userList.forEach(student => {
            const card = document.createElement("div");
            card.className = "student-card";
            card.innerHTML = `
                <span>${student.first_name} ${student.last_name}</span>
                <p>${student.email}</p>
                <button class="invite-btn">Invite</button>
            `;

            const inviteButton = card.querySelector(".invite-btn")
            inviteButton.addEventListener("click", async event => {
                event.preventDefault();
                inviteButton.disabled = true;
                const success = await sendInvitation(student.email);
                if (success) {
                    alert("Invitation code sent");
                    card.remove();
                }
                else {
                    alert("Error in sending the invitation");
                    inviteButton.disabled = false;
                }
            })
            container.appendChild(card);
        })
    }
}

async function sendInvitation(studentEmail){
    try{
        const classroomId = localStorage.getItem('classroomId');
        const body = {
            "email": studentEmail,
            "classroomId": classroomId
        }
        await postFunction(`${baseRoute}/invite`, body);
        return true;
    }
    catch (error) {
        if (error.isServerError){
            alert(`Error: ${error.message}`);
        }
        else {
            console.error("Connection Error:", error)
            alert(`Impossible to connect to server or internal server error`)
        }
    }
}

function initEmailFilterListener(){
    const searchEmail = document.getElementById("searchEmail");
    if (searchEmail){
        searchEmail.addEventListener("input",async event => {
            const searchQuery = event.target.value.toLowerCase();

            const usersFiltered = usersNotInClassroom.filter(
                user => user.email.toLowerCase().includes(searchQuery));

            await populateStudentCards(usersFiltered);
        });
    }
}

async function enterClassroom(classroomId){
    const token = localStorage.getItem('token');
    const response = await fetch(
        `${API_URL}/${baseRoute}/enter?classroomId=${classroomId}`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

    if (response === null) {
        return false;
    }

    const data = await response.json();
    return data.message === true;
}

function initClassroomHomeListeners(){
    const createButton = document.getElementById("createButton");
    if (createButton){
        createButton.addEventListener("click", event => {
            event.preventDefault();
            goTo('createClassroom');
        })
    }
    if (!classroomHomeListenerDocumentActive) {
        classroomHomeListenerDocumentActive = true;
        document.addEventListener('click', async event => {
            if (event.target.classList.contains('enter-btn')) {
                if (event.target.classList.contains('is-closed')){
                    alert("Classroom is closed, can't enter");
                    return;
                }
                const card = event.target.closest(".classroomCard");
                const classId = card.dataset.id;
                const status = await enterClassroom(classId)
                if (status === true) {
                    localStorage.removeItem('classroomId');
                    localStorage.setItem('classroomId', classId);
                    goTo('classroom');
                } else {
                    alert("Can't join classroom!");
                    goTo('classroomHome');
                }
            }
        });
    }
}

function initClassroomListeners(){
    const editButton = document.getElementById("editButton");
    const inviteButton = document.getElementById("inviteButton");
    const classroomTests = document.getElementById("classroomTests");
    const createTestButton = document.getElementById("createTestButton");

    if (editButton){
        editButton.addEventListener("click", event => {
            event.preventDefault();
            goTo('editClassroom');
        })
    }
    if (inviteButton){
        inviteButton.addEventListener("click", event => {
            event.preventDefault();
            goTo('inviteInClassroom');
        });
    }

    if (classroomTests){
        classroomTests.addEventListener("click", event => {
            event.preventDefault();
            goTo('classroomTest');
        })
    }

    if (createTestButton){
        createTestButton.addEventListener("click", event => {
            event.preventDefault();
            goTo("createTest");
        })
    }
}

function genericClassroomFormListeners(){
    const fieldSelection = document.getElementById("fieldSelection");
    const subjectsList = document.getElementById("subjectsList");
    const subjectInput = document.getElementById("subjectInput");

    fieldSelection.addEventListener("change", () => {
        subjectsList.innerHTML = "";
        subjectInput.value = "";
        populateDataList();
    });

    subjectInput.addEventListener("input", () =>{
        populateDataList();
    });
}

export async function loadClassroomInfo(){
    const token = localStorage.getItem('token');
    const classroomId = localStorage.getItem('classroomId');
    const getInfo = `?classroomId=${classroomId}`;
    const response = await fetch(`${API_URL}/${baseRoute}/info${getInfo}`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (response === null){
        alert("Error in loading classroom info, return to classroom pace")
        goTo('classroom');
    }

    const data = await response.json();
    const classroomDoc = data.message
    const subject = classroomDoc.subject;

    classroomInfo = {
        "name": classroomDoc.name,
        "subjectName": subject.subject_name,
        "description": classroomDoc.description,
        "classroomStatus": classroomDoc.classroom_status
    }
}

async function preloadForm(){
    document.getElementById("classroomName").value = classroomInfo.name;
    document.getElementById("classDescription").value = classroomInfo.description;
    document.getElementById("subjectInput").value = classroomInfo.subjectName;

    const statusRadio = document.querySelector(
        `input[name="status"][value="${classroomInfo.classroomStatus}"]`);
    if (statusRadio) {
        statusRadio.checked = true;
    }
}

function populateMemberList(){
    const memberListContainer = document.getElementById("memberListContainer");
    if (memberListContainer){
        const creatorSection = document.createElement("div");
        creatorSection.innerHTML = `
            <h4>Creator:</h4>
            <ul>
                <li class="creator-item">${creator.first_name} ${creator.last_name}</li>
            </ul>
        `;
        memberListContainer.appendChild(creatorSection);

        if (usersInClassroom && usersInClassroom.length > 0){
            const membersSection = document.createElement("div");
            membersSection.innerHTML = `<h4>Members</h4><ul id="memberList"></ul>`
            const membersList = membersSection.querySelector("ul");

            usersInClassroom.forEach(user => {
                const li = document.createElement("li");
                li.textContent = `${user.first_name} ${user.last_name}`;
                membersList.appendChild(li);
            });
            memberListContainer.appendChild(membersSection)
        }
    }
}

async function loadClassroomChat(){
    const getInfo =
        (`?action=get_classroom_conversations&classroom_id=${localStorage.getItem('classroomId')}`);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/chat${getInfo}`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (data.success === false){
        alert("error in loading classroom conversation, EXIT");
        goTo('classroomHome');
    }
    else {
        const classroomConversation = data.message;
        localStorage.removeItem('conversation_id');
        localStorage.setItem("conversation_id", classroomConversation._id);
        await loadMessages();
        setRefreshInterval(loadMessages,2000)
        document.getElementById("sendMessageButton").addEventListener("click", sendMessage);
    }
}

export async function checkIsOwner() {
    const userInfo = getUserInfo();
    const token = localStorage.getItem('token');
    const classroomId = localStorage.getItem('classroomId');
    if (!classroomId) {
        alert("No classroom id found, returning to classrooms home")
        goTo('classroomHome');
    }
    const response = await fetch(`${API_URL}/${baseRoute}/memberlist?classroomId=${classroomId}`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (data.status === false) {
        alert("error in retrieving classroom info, return to classroom home")
        goTo('classroomHome');
    }

    let classroomMembers = data.message;
    let creator = classroomMembers.creator;

    return userInfo.email === creator.email;
}

function linkToClassroomHome(){
    const linkToClassroom = document.getElementById("linkToClassroom");
    if (linkToClassroom) {
        linkToClassroom.addEventListener("click", event => {
            event.preventDefault();
            goTo('classroom');
        })
    }
}