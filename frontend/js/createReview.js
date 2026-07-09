import { API_URL } from "../app.js";

let goTo;

export function init(page, navigateTo){

    if(navigateTo){
        goTo = navigateTo;
    }

    if(page === "writeReview"){

        const reviewForm = document.getElementById("reviewForm");

        if(reviewForm){
            reviewForm.addEventListener("submit", handleReview);
        }

        const backButton = document.getElementById("backButton");

        if(backButton){
            backButton.addEventListener("click", () =>{
                goTo("main")
            });
        }
    }
}


async function handleReview(event) {

    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
        alert("you must be logged in");

        if (goTo) {
            goTo("main");
        }
        return;
    }

    const email = document.getElementById("tutorEmail").value.trim();
    const comment = document.getElementById("comment").value.trim();
    const rating = Number(document.getElementById("rating").value);

    if(rating === 0){
        alert("Please select a rating");
        return;
    }

    try{
        const response = await fetch(`${API_URL}/review`,{
            method: "POST",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                email: email,
                rating: rating,
                comment: comment,
            })
        });

        const data = await response.json();

        if(response.ok){
            document.getElementById("reviewForm").reset();
        }else{
            alert(data.message);
        }
    }catch(error){
        alert("Impossible to connect to server")
    }
}