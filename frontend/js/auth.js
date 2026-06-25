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
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            // saving information sent by server
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            alert('Login successful');
            goTo('main');
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

    // saving variables for the registration
    const firstName = document.getElementById('fname').value;
    const lastName = document.getElementById('lname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('password2').value;

    // checking if the two passwords are the same

    if (password !== confirmPassword){
        alert('Passwords do not match!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/register`, {
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
            alert('Registration successfully registered!');
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