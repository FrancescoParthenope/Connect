import { API_URL } from "../app.js";
import { loadSidebar } from "./utils.js";

let goTo;
let refreshIntervall;
let conversationTitle;

// Initialize the chat page
export async function init(page, navigateTo) {

    loadSidebar(navigateTo);

    if (navigateTo) {
        goTo = navigateTo;
    }

    if (page === "chat") {

        conversationTitle = localStorage.getItem("conversation_title");
        document.getElementById("conversationTitle").textContent = conversationTitle;

        await loadMessages();

        // Refresh the chat every 2 seconds
        refreshIntervall = setInterval(loadMessages, 2000);
        document.getElementById("sendMessageButton").addEventListener("click", sendMessage);
    }

    const backButton = document.getElementById("backButton");
    if (backButton) {
        backButton.addEventListener("click", () => {
            clearInterval(refreshIntervall);
            goTo("chats")
        });
    }
}

export async function loadMessages(){

    const token = localStorage.getItem("token");
    const conversationId = localStorage.getItem("conversation_id");

    try{
        const response = await fetch(
            `${API_URL}/chat?action=get_messages&conversation_id=${conversationId}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();
        console.log(data);

        if(response.ok){
            displayMessages(data.message)
        }else{
            alert(data.message)
        }
    }catch(error){
        alert("Impossible to connect to server");
    }
}

export async function sendMessage() {

    const token = localStorage.getItem("token");
    const conversationId = localStorage.getItem("conversation_id");
    const input = document.getElementById("messageInput");
    const message = input.value.trim();

    if (!message) {
        alert("Please write a message.");
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/chat`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: "send_message",
                    conversation_id: conversationId,
                    message: message
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            // Clear the input field
            input.value = "";
            // Reload the messages
            await loadMessages();
        } else {
            alert(data.message);
        }

    } catch (error) {
        console.error(error);
        alert("Impossible to connect to server");
    }
}

function displayMessages(messages){

    const container = document.getElementById("messagesContainer");

    // Clear previous messages
    container.innerHTML = "";

    // Display each message
    messages.forEach(message => {
        const creationDate = new Date(message.creation_date).toLocaleString();

        const div = document.createElement("div");

        // Apply a different style depending on who sent the message
        if(message.is_mine){
            div.className ="sentMessage"
        }else{
            div.className = "receiveMessage"
        }

        div.innerHTML = `
            <hr>
            <p>
                <strong>${message.sender_name}</strong>
            </p>
            <p>
                ${message.message}
            </p>
            <small>
                ${creationDate}
            </small>
        `;
        container.appendChild(div);
    });

    container.scrollTop = container.scrollHeight;
}
