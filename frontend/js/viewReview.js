import { API_URL } from "../app.js";

let goTo;

export function init(page, navigateTo){

    if(navigateTo){
        goTo = navigateTo;
    }

    if(page === "viewReview"){
        loadReviews();

        const backButton = document.getElementById("backButton");
        if(backButton){
            backButton.addEventListener("click", () =>{
                goTo("main");
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

        const response = await fetch(`${API_URL}/review`,{
            method: "GET",
            headers:{"Authorization": `Bearer ${token}`

            }
        });

        const data = await response.json();

        if(response.ok){
            console.log(data)
        }else{
            alert(data.message);
        }

    }catch(err){
        alert("Impossible to connect to server");
    }
}
