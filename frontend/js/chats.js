import { API_URL } from "../app.js";

let goTo;
let lastMessage;
let allConversations = [];

export async function init(page, navigateTo) {

    if (navigateTo) {
        goTo = navigateTo;
    }

    if (page === "chats") {
        await loadConversations();
    }

    const backButton = document.getElementById("backButton");
    if (backButton) {
        backButton.addEventListener("click", () => {
            goTo("main")
        });
    }

    const newChatButton = document.getElementById("newChatButton");
    if (newChatButton) {
        newChatButton.addEventListener("click", () => {
            goTo("newChat");
        });
    }

    const searchInput = document.getElementById("searchConversationInput");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            const text = this.value.toLowerCase();

            const filtered = allConversations.filter((conversation) => {
                return conversation.title.toLowerCase().includes(text)
            });
            displayConversations(filtered,goTo);
        });
    }
}

async function loadConversations() {

    const token = localStorage.getItem("token");

    try{
        const response = await fetch(`${API_URL}/chat?action=get_conversation`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

        const data = await response.json();

        if(response.ok){
            allConversations = data.message;
            displayConversations(allConversations, goTo);
        }else{
            alert(data.message);
        }
    }catch(err){
        alert("Impossible to connect to server");
    }
}

function displayConversations(conversations, goTo) {
    const container = document.getElementById("conversationsContainer");

    container.innerHTML = "";

    conversations.forEach(conversation => {
        const div = document.createElement("div");

        div.className = "ConversationCard";

        const lastActivity = new Date(conversation.last_activity).toLocaleString();

        if(conversation.last_message_sent_by_me){
            lastMessage = `✓ ${conversation.last_message}`;
        }else{
            lastMessage = conversation.last_message;
        }

        div.innerHTML = `
                <div class="conversationInfo">
                    <h3>${conversation.title}</h3>
                    <p>${lastMessage}</p>
                </div>
        <small>${lastActivity}</small> `;

        div.addEventListener("click", (e) => {
            localStorage.setItem("conversation_id", conversation._id);
            localStorage.setItem("conversation_title", conversation.title);
            goTo("chat");
        });
        container.appendChild(div);
    });
}