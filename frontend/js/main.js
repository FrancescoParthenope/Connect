let goTo;

function mainListener(page, navigateTo){
    goTo = navigateTo;

    const linkToLogin = document.getElementById("linkToLogin");
    const linkToRegister = document.getElementById("linkToRegister");
    const linkToLogout = document.getElementById("linkToLogout");

    if (linkToLogin){
        linkToLogin.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('login');
        })
    }

    if (linkToRegister){
        linkToRegister.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('register');
        })
    }

    if (linkToLogout){
        linkToLogout.addEventListener("click", (event) => {
            event.preventDefault();
            localStorage.clear();
            alert("Logged out successfully");
            goTo('main')
        })
    }
}

export { mainListener }