import { API_URL } from "../app.js";

let goTo;

export async function init(page, navigateTo){

    if(navigateTo){
        goTo = navigateTo;
    }

    if(page === "viewReview"){
        await loadReviews();

        const backButton = document.getElementById("backButton");
        if(backButton){
            backButton.addEventListener("click", () =>{
                goTo("dashboard_home");
            });
        }
    }
}

async function loadReviews(){

    const token = localStorage.getItem("token");

    if(!token){
        alert("you must be logged in");

        if(goTo) {
            goTo("login");
        }
        return;
    }

    try{

        const response = await fetch(`${API_URL}/viewReviews`,{
            method: "GET",
            headers:{"Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if(data.success === true){
            await populateReviewContainer(data.message)
        }else{
            alert(data.message);
        }

    }catch(err){
        alert("Impossible to connect to server");
    }
}

async function populateReviewContainer(reviewList){
    const reviewsContainer = document.getElementById("reviewsContainer");
    const user = JSON.parse(localStorage.getItem("user"));
    const user_name = `${user.first_name} ${user.last_name}`;

    if (reviewsContainer){
        reviewsContainer.innerHTML = "";
        const reviewsReceived = document.createElement("div");
        reviewsReceived.classList.add("reviews-received");
        const reviewsReceivedText = document.createElement("h3");
        reviewsReceivedText.innerHTML = "Reviews Received";
        reviewsReceived.appendChild(reviewsReceivedText);

        const reviewsDone = document.createElement("div");
        reviewsDone.classList.add("reviews-done");
        const reviewsDoneText = document.createElement("h3");
        reviewsDoneText.innerHTML = "Reviews Done";
        reviewsDone.appendChild(reviewsDoneText);

        reviewsContainer.appendChild(reviewsReceived);
        reviewsContainer.appendChild(reviewsDone);

        reviewList.forEach(review => {
            const dateObj = new Date(review.creation_date);

            const formattedDate = dateObj.toLocaleString(navigator.language, {
                dateStyle: 'short',
                timeStyle: 'short'
            });
                const card = document.createElement("div");
                card.classList.add("review-card");
                card.innerHTML = `
                    <h4>Tutor name: ${review.tutor_name}</h4>
                    <p>${review.comment}</p>
                    <p>Rating: ${review.rating}</p>
                    <p>Review done by: ${review.student_name}</p>
                    <small>Data: ${formattedDate}</small>
                `;
                if (review.tutor_name === user_name){
                    reviewsReceived.appendChild(card);
                }
                else {
                    reviewsDone.appendChild(card);
                }
        });

        reviewsReceived.appendChild(document.createElement("hr"));
        reviewsDone.appendChild(document.createElement("hr"));
    }
}