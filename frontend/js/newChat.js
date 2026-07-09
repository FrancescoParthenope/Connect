import { API_URL } from "../app.js";
import { loadSidebar } from "./utils.js";

let goTo;
let allUsers = [];

export async function init(page, navigateTo) {

    loadSidebar(navigateTo);

    if(navigateTo) {
        goTo = navigateTo;
    }

    if(page === "newChat") {
        await loadUsers();
    }

    const backButton = document.getElementById("backButton");
    if(backButton) {
        backButton.addEventListener("click", () => {
            goTo("chats");
        });
    }

    const searchInput = document.getElementById("searchUserInput");
    if (searchInput) {
        searchInput.addEventListener("input", function () {

            const text = this.value.toLowerCase();
            const filtered = allUsers.filter(user => `${user.first_name} ${user.last_name}`.toLowerCase().includes(text));
            displayUsers(filtered);
        });
    }
}

async function loadUsers(){

    const token = localStorage.getItem("token");

    try{
        const response = await fetch(
            `${API_URL}/chat?action=search_user`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if(response.ok){
            allUsers = data.message;
            displayUsers(allUsers);
        }else {
            alert(data.message);
        }
    }catch(err){
        alert("Impossible to connect to server");
    }
}


function displayUsers(users){
    const container = document.getElementById("usersContainer");

    container.innerHTML = "";

    users.forEach(user => {
        const div = document.createElement("div");

        div.className = "userCard";
        div.innerHTML = `<h3>${user.first_name} ${user.last_name}</h3>`;

        div.addEventListener("click", async () => {

            const token = localStorage.getItem("token");

            try {
                const response = await fetch(
                    `${API_URL}/chat?action=get_private_conversations&email=${user.email}`,
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem("conversation_id", data.message._id);
                    localStorage.setItem("conversation_title", `${user.first_name} ${user.last_name}`);
                    goTo("chat");
                } else {
                    alert(data.message);
                }
            } catch (error) {
                alert("Impossible to connect to server");
            }
        });
        container.appendChild(div);
    });
}