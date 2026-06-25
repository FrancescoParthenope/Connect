import * as Auth from "./js/auth.js";
import * as Main from "./js/main.js";
import * as TutorTest from "./js/tutorTest.js";

export const API_URL = "http://127.0.0.1:8000";

const routes = { // used to create path and load listener dynamically
    'login': { folder: 'auth', module: Auth },
    'register': { folder: 'auth', module: Auth },
    'main': { folder: '', module: Main},
    'eligibleSubjects': {folder: 'tutorTest', module: TutorTest}
}

export async function navigateTo(page){
    const app = document.getElementById('app');
    const route = routes[page];

    if (!route) {
        app.innerHtml = `<h2>Error: Page: ${page} not found</h2>`
        return
    }

    try {
        // creating the path
        const path = route.folder ?
            `views/${route.folder}/${page}.html` : `views/${page}.html`;

        const response = await fetch(path)

        // used to block instantly in case of error
        if (!response.ok) throw new Error(`Could not load ${page}`);

        app.innerHTML = await response.text();

        // loading dynamically the function init in every module
        if (route.module && typeof route.module.init === 'function'){
            route.module.init(page, navigateTo);
        }
    }
    catch (error) {
        console.error("Routing Error", error);
        app.innerHTML = `<h2>Error: ${error.message}</h2>`
    }
}

navigateTo('main');