import {API_URL} from "../app.js";

let subjectsList = []

export async function getSubjectsList() {
    if (subjectsList.length > 0) {
        return subjectsList;
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/subjects/all_subjects`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await response.json();
    if (response.ok){
        subjectsList = data.message;
        return subjectsList;
    }

    throw new Error(data.message);
}

export async function getMySubjectsList() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/mysubjects`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    const data = await response.json();
    if (response.ok){
        return data.message;
    }

    throw new Error(data.message);
}