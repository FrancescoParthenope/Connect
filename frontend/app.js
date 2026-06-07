import * as Auth from "./js/auth.js";
import * as Main from "./js/main.js";

export const API_URL = "http://127.0.0.1:5000";

export async function navigateTo(page){
    const app = document.getElementById('app');

    try {
        let folder = (page === 'login' || page === 'register') ? 'auth' : '';
        let path = (folder !== '') ? `views/${folder}` : `views`;

        const response = await fetch(`${path}/${page}.html`)

        // used to block instantly in case of error
        if (!response.ok) throw new Error(`Could not load ${page}`);

        app.innerHTML = await response.text();

        // loading listener (to change after, now just testing)
        if (page === 'main'){
            Main.mainListener(page,navigateTo);
        }
        else {
            Auth.authListener(page, navigateTo);
        }
    }
    catch (error) {
        console.error("Routing Error", error);
        app.innerHTML = `<h2>Error: ${error.message}</h2>`
    }
}

navigateTo('main');