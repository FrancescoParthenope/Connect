import {API_URL} from "../app.js";

let goTo;

function authListener(page, navigateTo){
    if (navigateTo)
        goTo = navigateTo;

    if(page === 'register'){
        const registerForm = document.getElementById('registerForm')
        if (registerForm){
            console.log("SPIA 1: Form di registrazione trovato! Aggancio il listener...");
            registerForm.addEventListener('submit', handleRegister)
        }
        else {
            console.error(`SPIA 1 ERRORE: Non ho trovato nessun form id='registerForm'>`);
        }
    }

    if (page === 'login'){
        const loginForm = document.getElementById('loginForm')
        if (loginForm){
            console.log("SPIA 1: form di login trovato! aggancio il listener...")
            loginForm.addEventListener('submit', handleLogin)
        }
        else {
            console.error("SPIA 1: ERRORE: non ho trovato nessun form id='loginForm'>");
        }

        const linkToRegister = document.getElementById('linkToRegister')
        if (linkToRegister){
            console.log("SPIA 1.1: Link alla pagina di registrazione trovato, aggancio il listener...");
            linkToRegister.addEventListener('click', (event) => {
                event.preventDefault();
                goTo('register');
            });
        }
    }
}

async function handleLogin(event){
    console.log("SPIA 2: il pulsante è stato premuto! Tento di bloccare il refresh...")
    event.preventDefault();

    console.log("SPIA 3: Refresh bloccato con successo!")

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    console.log("SPIA 4: Dati raccolti:", {email});

    try {
        console.log("SPIA 5: invio fetch a:", `${API_URL}/api/login`)
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        console.log("SPIA 6: Risposta server ricevuta. Status:", response.status);
        const data = await response.json();

        if (response.ok) {
            // saving informations sent by server
            localStorage.setItem('user', JSON.stringify(data.user));
            alert('Login successful');
            goTo('main');
        } else {
            alert(`Login failed with status ${response.status}`);
        }
    }
    catch(error){
        console.error("Connection Error:", error)
        alert(`Impossible to connect to server`)
    }
}

async function handleRegister(event){
    console.log("SPIA 2: Il pulsante è stato premuto! Tento di bloccare il refresh...");
    event.preventDefault();

    console.log("SPIA 3: Refresh bloccato con successo!");

    // saving variables for the registration
    const firstName = document.getElementById('fname').value;
    const lastName = document.getElementById('lname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('password2').value;

    console.log("SPIA 4: Dati raccolti:", { firstName, lastName, email });

    // checking if the two passwords are the same

    if (password !== confirmPassword){
        alert('Passwords do not match!');
        return;
    }

    try {
        console.log("SPIA 5: Invio fetch a:", `${API_URL}/api/register`);
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

        console.log("SPIA 6: Risposta server ricevuta. Status:", response.status);
        // in the future adding a const data = await .... for using the information from the server ?
        await response.json();

        if (response.ok) {
            alert('Registration successfully registered!');
            goTo('login');
        } else {
            alert(`Registration failed with status ${response.status}`);
        }
    }

    catch(error){
        console.error("Connection Error:", error)
        alert(`Impossible to connect to server`)
    }
}

export { authListener, handleRegister, handleLogin }