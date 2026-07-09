import {API_URL} from "../app.js";

let goTo;

export function init(page, navigateTo){
    if (navigateTo)
        goTo = navigateTo;

    if(page === 'register'){
        const registerForm = document.getElementById('registerForm')
        if (registerForm){
            registerForm.addEventListener('submit', handleRegister)
        }

        const linkToLogin = document.getElementById("linkToLogin");
        if (linkToLogin){
            linkToLogin.addEventListener('click', (event) => {
                event.preventDefault();
                goTo('login');
            })
        }
    }

    if (page === 'login'){
        const loginForm = document.getElementById('loginForm')
        if (loginForm){
            loginForm.addEventListener('submit', handleLogin)
        }

        const linkToRegister = document.getElementById('linkToRegister')
        if (linkToRegister){
            linkToRegister.addEventListener('click', (event) => {
                event.preventDefault();
                goTo('register');
            });
        }
    }
}

async function handleLogin(event){
    event.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        /* we save after the login the information that are useful for the user
         * inside the local storage. This way we can recover theme when we need them
         * with ease, and we don't need to worry about their correctness because server
         * will do the checks
         */
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            alert('Login successful');
            goTo('dashboard_home');
        } else {
            alert(`Login failed with status: ${data["error"]}`);
        }
    }
    catch(error){
        console.error("Connection Error:", error)
        alert(`Impossible to connect to server`)
    }
}

async function handleRegister(event){
    event.preventDefault();

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    const firstName = document.getElementById('name').value;
    const lastName = document.getElementById('surname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword){
        alert('Passwords do not match!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email: email,
                password: password,
            })
        });

        // in the future adding a const data = await .... for using the information from the server ?
        await response.json();

        if (response.ok) {
            alert('User successfully registered!');
            goTo('main');
        } else {
            alert(`Registration failed with status ${response.status}`);
        }
    }

    catch(error){
        console.error("Connection Error:", error)
        alert(`Impossible to connect to server`)
    }
}