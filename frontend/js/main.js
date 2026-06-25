let goTo;

export function init(page, navigateTo){
    goTo = navigateTo;

    const linkToLogin = document.getElementById("linkToLogin");
    const linkToRegister = document.getElementById("linkToRegister");
    const linkToLogout = document.getElementById("linkToLogout");
    const linkToEligibleSubjects = document.getElementById("linkToEligibleSubjects");

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
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            alert("Logged out successfully");
            goTo('main')
        })
    }

    if (linkToEligibleSubjects){
        linkToEligibleSubjects.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('eligibleSubjects');
        })
    }
}