import * as Auth from "./js/auth.js";
import * as Main from "./js/main.js";
import * as TutorTest from "./js/tutorTest.js";
import * as Payments from "./js/payment.js";
import * as Users from "./js/user.js";
import * as Tests from "./js/createTest.js";
import * as Classroom from "./js/classroom.js";
import * as ClassroomTest from "./js/classroomTest.js";
import * as StartTest from "./js/startTest.js";
import * as Tutor from "./js/tutor.js";
import * as ViewTest from "./js/viewTest.js";
import * as CorrectTests from "./js/correctTests.js";
import * as CorrectSingleTest from "./js/correctSingleTest.js";
import * as ReviewTest from "./js/reviewTest.js";
import * as Chat from "./js/chat.js";
import * as Chats from "./js/chats.js";
import * as NewChat from "./js/newChat.js";
import * as Review from "./js/createReview.js";
import * as ViewReviews from "./js/viewReview.js";

import {clearChatInterval} from "./js/utils.js";

export const API_URL = "http://127.0.0.1:8000/api";

// this dictionary is used to create the path and load listeners dynamically
// in this way, every time we add a new functionality to the frontend
// we just need to update this dictionary to create the correct path and
// recover the listener
const routes = {
    'login': { folder: 'auth', module: Auth },
    'register': { folder: 'auth', module: Auth },
    'main': { folder: '', module: Main},
    'eligibleSubjects': {folder: 'tutorTest', module: TutorTest},
    'activeApplications': {folder: 'tutorTest', module: TutorTest},
    'tutorTest': {folder: 'tutorTest', module: TutorTest},
    'insert_payments': {folder: 'payments', module: Payments},
    'update_profile': {folder: 'user', module: Users},
    'createTest': {folder: 'classroomTest', module: Tests},
    "classroomHome": {folder: 'classroom', module: Classroom},
    'classroomTest': {folder: 'classroomTest', module: ClassroomTest},
    'startTest': {folder: 'classroomTest', module: StartTest},
    'completedApplications': {folder: 'tutorTest', module: TutorTest},
    'searchBySubject': {folder: 'tutor', module: Tutor},
    'viewTest': {folder: 'classroomTest', module: ViewTest},
    'correctTests': {folder: 'classroomTest', module: CorrectTests},
    'correctSingleTest': {folder: 'classroomTest', module: CorrectSingleTest},
    'reviewTest': {folder: 'classroomTest', module: ReviewTest},
    'chat': {folder: 'chat', module: Chat},
    'chats': {folder: 'chat', module: Chats},
    'newChat': {folder: 'chat', module: NewChat},
    'writeReview': {folder: 'review', module: Review},
    'viewReview': {folder: 'review', module: ViewReviews},
    'home_page':{folder: 'home_page', module: Main},
    'dashboard_home':{folder: 'home_page', module: Main},
    'becomeTutor':{folder: 'tutorTest', module: TutorTest},
}

const publicPages = [
    'home_page',
    'login',
    'register'
]

export async function navigateTo(page){
    clearChatInterval(page);
    const app = document.getElementById('app');
    const token = localStorage.getItem('token');

    if (!publicPages.includes(page) && !token){
        page = 'home_page';
    }
    if (token && (page === 'login' || page === 'register')) {
        page = 'dashboard_home';
    }

    const route = routes[page];

    if (!route) {
        app.innerHtml = `<h2>Error: Page: ${page} not found</h2>`
        return
    }

    try {
        const path = route.folder ?
            `views/${route.folder}/${page}.html` : `views/${page}.html`;

        const response = await fetch(path)

        if (!response.ok) throw new Error(`Could not load ${page}`);

        app.innerHTML = await response.text();

        if (route.module && typeof route.module.init === 'function'){
            route.module.init(page, navigateTo);
        }
    }
    catch (error) {
        console.error("Routing Error", error);
        app.innerHTML = `<h2>Error: ${error.message}</h2>`
    }
}

await navigateTo('dashboard_home');