import { API_URL } from "../app.js";

let goTo;

export function init(page, navigateTo) {

    if (navigateTo) {
        goTo = navigateTo;
    }

    if (page === "update_profile") {

        loadProfile();

        const profileForm = document.getElementById("ProfileForm");

        if (profileForm) {
            profileForm.addEventListener(
                "submit",
                handleUpdateProfile
            );
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

        const response = await fetch(`${API_URL}/api/profile`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById("firstName").value = data.data.first_name || "";
            document.getElementById("lastName").value = data.data.last_name || "";
            document.getElementById("birthDate").value = data.data.birth_date || "";
            document.getElementById("bio").value = data.data.bio || "";
            document.getElementById("profile_picture").value = data.data.profile_picture || "";
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
        const response = await fetch(`${API_URL}/api/profile`, {
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
                loadProfile();
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

