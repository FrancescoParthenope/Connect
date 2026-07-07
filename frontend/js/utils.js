import {API_URL} from "../app.js";

export function formatTime(secondsLeft){
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    return `${minutes} minutes and ${seconds.toString().padStart(2, '0')} seconds left`
}
/*
route must be a string that completes the route after the "api"
so to complete right the route must be something like "/name_of_action".
body is an object for the JSON.stringify
 */
export async function postFunction(route,body){
    const token = localStorage.getItem('token');

    const response =  await fetch(`${API_URL}/${route}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });
    const data = await response.json();

    if (!response.ok){
        const error = new Error(data.message || "Something went wrong");
        error.isServerError = !!data.message;
        error.data = data;
        throw error;
    }

    return data;
}