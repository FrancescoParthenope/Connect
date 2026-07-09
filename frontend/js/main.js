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
    const linkToSearchBySubject = document.getElementById("linkToSearchBySubject");
    const linkToClassroomHome = document.getElementById("linkToClassroomHome");
    const linkToChats = document.getElementById("linkToChat");
    const linkToCreateReview = document.getElementById("linkToCreateReview");
    const linkToViewReview = document.getElementById("linkToViewReview");
    const linkToDashboardHome = document.getElementById("linkToDashboardHome");
    const linkToBecomeTutor = document.getElementById("linkToBecomeTutor");
    const linkToReviewPage = document.getElementById("linkToReviewPage");

    const user = JSON.parse(localStorage.getItem("user"));

    if(user){
        const isTutor = user.roles.includes("tutor")
        if(!isTutor && linkToCreateTest){
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
            goTo('home_page');
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

    if (linkToClassroomHome) {
        linkToClassroomHome.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('classroomHome');
        })
    }

    if (linkToSearchBySubject) {
        linkToSearchBySubject.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('searchBySubject');
        })
    }

    if (linkToClassroomHome) {
        linkToClassroomHome.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('classroomHome');
        })
    }


    if(linkToChats){
        linkToChats.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('chats');
        })
    }

    if(linkToCreateReview){
        linkToCreateReview.addEventListener("click", (event) => {
            event.preventDefault();
            goTo('writeReview');
        })
    }

    if(linkToViewReview){
        linkToViewReview.addEventListener("click", (event) => {
            event.preventDefault();
            goTo("viewReview");
        })
    }

   if(linkToDashboardHome){
       linkToDashboardHome.addEventListener("click", (event) => {
           event.preventDefault();
           goTo('dashboard_home');
       })
   }

   if(linkToBecomeTutor){
       linkToBecomeTutor.addEventListener("click", (event) => {
           event.preventDefault();
           goTo('becomeTutor');
       })
   }

   if(linkToReviewPage){
       linkToReviewPage.addEventListener("click", (event) => {
           event.preventDefault();
           goTo('reviewPage');
       })
   }
}