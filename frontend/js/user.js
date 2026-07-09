import { API_URL } from "../app.js";
import { loadSidebar } from "./utils.js";

let goTo;

export async function init(page, navigateTo) {

    if (navigateTo) {
        goTo = navigateTo;
    }

    await loadSidebar(navigateTo);

    if (page === "update_profile") {
        const profileForm = document.getElementById("ProfileForm");

        if (profileForm) {
            await loadProfile();
            profileForm.addEventListener(
                "submit",
                handleUpdateProfile
            );
        }

        const backButton = document.getElementById("backButton");
        if (backButton) {
            backButton.addEventListener("click", () => {
                goTo("dashboard_home");
            });
        }
    }
}

async function loadProfile() {

    const token = localStorage.getItem("token");

    if (!token) {
        goTo("login");
        return;
    }

    try {

        const response = await fetch(`${API_URL}/profile`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success === true) {
            const firstName = document.getElementById("firstName");
            const lastName = document.getElementById("lastName");
            const bio = document.getElementById("bio");
            const birthDate = document.getElementById("birthDate");

            firstName.value = data.data.first_name || "";
            lastName.value = data.data.last_name || "";
            bio.value = data.data.bio || "";

            let birthValue = data.data.birth_date;
            if (!birthValue || birthValue === "") {
                birthValue = "";
            }
            else {
                birthValue = birthValue.split('T')[0]
            }
            birthDate.value = birthValue;
        }

    } catch (error) {
        console.error(error);
    }
}

async function handleUpdateProfile(event) {

    event.preventDefault();

    const token = localStorage.getItem("token");
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const birthDate = document.getElementById("birthDate").value;
    const bio = document.getElementById("bio").value;
    const profilePicture = document.getElementById("profile_picture").value;

    try {
        const response = await fetch(`${API_URL}/profile`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({

                first_name: firstName,
                last_name: lastName,
                birth_date: birthDate,
                bio: bio,
                profile_picture: profilePicture

            })

        });

        const data = await response.json();

        if (response.ok) {
            if (data.success) {
                alert(data.message || "Profile updated successfully");
                await loadProfile();
            } else {
                alert(`${data.message}, error code: ${response.status}`);
            }
        } else {
            alert(`Update profile failed with status ${response.status}`);
        }

    } catch (error) {
        console.error(error);
        alert("Impossible to connect to server");
    }
}