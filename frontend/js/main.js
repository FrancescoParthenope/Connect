let goTo;

export function init(page, navigateTo) {
    goTo = navigateTo;

    const linkToLogin = document.getElementById("linkToLogin");
    const linkToRegister = document.getElementById("linkToRegister");
    const linkToLogout = document.getElementById("linkToLogout");
    const linkToEligibleSubjects = document.getElementById("linkToEligibleSubjects");
    const linkToActiveApplications = document.getElementById("linkToActiveApplications");
    const linkToInsertPayments = document.getElementById("linkToInsertPayments");
    const linkToProfile = document.getElementById("linkToProfile");
    const linkToCreateTest = document.getElementById("linkToCreateTest");
    const linkToClassroomTest = document.getElementById("linkToClassroomTest");
    const linkToStartTest = document.getElementById("linkToStartTest");
    const linkToCompletedApplications = document.getElementById("linkToCompletedApplications");
    const linkToSearchBySubject = document.getElementById("linkToSearchBySubject");

    const user = JSON.parse(localStorage.getItem("user"));

    if(user){
        const role = user.roles[0];

        if(role === "student" && linkToCreateTest){
            linkToCreateTest.style.display = "none";
        }
    }

    if (linkToLogin) {
        linkToLogin.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('login');
        })
    }

    if (linkToRegister) {
        linkToRegister.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('register');
        })
    }

    if (linkToLogout) {
        linkToLogout.addEventListener("click", (event) => {
            event.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            alert("Logged out successfully");
            goTo('main')
        })
    }

    if (linkToEligibleSubjects) {
        linkToEligibleSubjects.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('eligibleSubjects');
        })
    }

    if (linkToActiveApplications) {
        linkToActiveApplications.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('activeApplications');
        })
    }

    if (linkToProfile) {
        linkToProfile.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('update_profile');
        })
    }

    if (linkToInsertPayments) {
        linkToInsertPayments.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('insert_payments');
        })
    }

    if (linkToCreateTest) {
        linkToCreateTest.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('createTest');
        })
    }

    if (linkToClassroomTest) {
        linkToClassroomTest.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('classroomTest');
        })
    }

    if (linkToStartTest) {
        linkToStartTest.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('startTest');
        })
    }

    if (linkToCompletedApplications) {
        linkToCompletedApplications.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('completedApplications');
        })
    }

    if (linkToSearchBySubject) {
        linkToSearchBySubject.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('searchBySubject');
        })
    }
}