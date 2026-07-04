
export function displayTests(tests, studentTests, goTo, toggleTest) {

    const user = JSON.parse(localStorage.getItem("user"));
    const role = user.roles[0];

    const containers = setupContainers(role);

    const studentMap = buildStudentMap(studentTests);

    if (role === "student") {
        tests.forEach(test => {

            const completedTest = studentMap[test.test_id];
            if (!test.is_active) {
                return;
            }

            if (!completedTest) {
                displayStudentTest(
                    test,
                    null,
                    containers,
                    goTo
                );
            }
        });

        /* Iterate through the student's completed tests, which are already sorted
        by submission date (most recent first). For each completed test, find the
        corresponding classroom test to retrieve its full information (title,
        time limit, active status, etc.). This allows the submitted tests to be
        displayed in the same order they were submitted while still showing all
        the classroom test details.*/

        studentTests.forEach(completedTest => {
            const classTest = tests.find(
                test => test.test_id === completedTest.test_id
            );
            if (classTest) {
                displayStudentTest(
                    classTest,
                    completedTest,
                    containers,
                    goTo
                );
            }
        });
    } else {
        tests.forEach(test => {
            displayTutorTest(
                test,
                containers,
                goTo,
                toggleTest
            );
        });
    }
}

/*
 * In this function we configure the containers that are visible to the user
 * But because what can be seen is different between the roles of the student
 * we pass the role of the user to get the right containers type to be shown
 */
function setupContainers(role) {

    const activeContainer = document.getElementById("activeTestsContainer");
    const inactiveContainer = document.getElementById("inactiveTestsContainer");
    const submittedContainer = document.getElementById("submittedTestsContainer");

    const inactiveTitle = document.getElementById("inactiveTestsTitle");
    const submittedTitle = document.getElementById("submittedTestsTitle");

    activeContainer.innerHTML = "";
    inactiveContainer.innerHTML = "";
    submittedContainer.innerHTML = "";

    if (role === "student") {
        inactiveTitle.style.display = "none";
        inactiveContainer.style.display = "none";
        submittedTitle.style.display = "block";
        submittedContainer.style.display = "block";
    } else {
        inactiveTitle.style.display = "block";
        inactiveContainer.style.display = "block";
        submittedTitle.style.display = "none";
        submittedContainer.style.display = "none";
    }
    return {
        activeContainer,
        inactiveContainer,
        submittedContainer
    };
}

function buildStudentMap(studentTests) {

    const studentMap = {};

    studentTests.forEach(test => {
        studentMap[test.test_id] = test;
    });

    return studentMap;
}


function displayTutorTest(test, containers, goTo, toggleTest) {

    let buttonHtml = `
        <button
            class="viewTestButton"
            data-id="${test.test_id}">
            View Test
        </button>
        <button
            class="toggleButton"
            data-id="${test.test_id}"
            data-active="${test.is_active}">
            ${test.is_active ? "Deactivate" : "Activate"}
        </button>
    `;

    const div = document.createElement("div");

    div.innerHTML = `
        <hr>
        <h3>${test.title}</h3>
        <p><strong>Time limit:</strong> ${test.time_limit} minutes</p>
        <p><strong>Availability:</strong>
            ${test.is_active ? "Active" : "Inactive"}
        </p>
        ${buttonHtml}
    `;

    if (test.is_active) {
        containers.activeContainer.appendChild(div);
    } else {
        containers.inactiveContainer.appendChild(div);
    }

    const button = div.querySelector(".toggleButton");
    const viewTestButton = div.querySelector(".viewTestButton");

    viewTestButton.addEventListener("click", function () {
        localStorage.setItem("test_id", test.test_id);
        goTo("viewTest");
    });

    button.addEventListener("click", function () {
        toggleTest(this.dataset.id, this.dataset.active === "true");
    });
}

function displayStudentTest(test, completedTest, containers, goTo) {

    let studentInfo = "";
    let buttonHtml = "";

    if (!completedTest) {
        studentInfo = `
            <p><strong>Status:</strong> NOT STARTED</p>
        `;

        buttonHtml = `
            <button
                class="startButton"
                data-id="${test.test_id}">
                Start Test
            </button>
        `;

    } else {

        const submittedDate =
            new Date(completedTest.completed_date).toLocaleString();

        let displayStatus = completedTest.status;

        if (displayStatus === "COMPLETED") {
            displayStatus = "PASSED ✅";
        } else if (displayStatus === "FAILED") {
            displayStatus = "FAILED ❌";
        } else if (displayStatus === "CORRECTION") {
            displayStatus = "IN CORRECTION...";
        }

        studentInfo = `
            <p><strong>Status:</strong> ${displayStatus}</p>

            <p><strong>Submitted:</strong>
                ${submittedDate}
            </p>
        `;

        if (
            completedTest.status !== "CORRECTION" &&
            completedTest.score !== null
        ) {
            studentInfo += `
                <p><strong>Score:</strong>
                    ${completedTest.score}
                </p>
            `;
        }

        if (completedTest.status === "CORRECTION") {

            buttonHtml = `
                <button disabled>
                    Test in correction
                </button>
            `;

        } else if (completedTest.status === "COMPLETED") {

            buttonHtml = `
                <button
                    class="viewResultButton"
                    data-id="${test.test_id}">
                    View Result
                </button>
            `;

        } else if (completedTest.status === "FAILED") {

            buttonHtml = `
                <button
                    class="retryButton"
                    data-id="${test.test_id}">
                    Retry Test
                </button>
            `;
        }
    }

    const div = document.createElement("div");

    div.innerHTML = `
        <hr>

        <h3>${test.title}</h3>

        <p><strong>Time limit:</strong>
            ${test.time_limit} minutes
        </p>
        ${studentInfo}
        ${buttonHtml}
    `;

    if (!completedTest) {
        containers.activeContainer.appendChild(div);
    } else {
        containers.submittedContainer.appendChild(div);
    }

    const startButton = div.querySelector(".startButton");

    if (startButton) {
        startButton.addEventListener("click", function () {
            localStorage.setItem("test_id", this.dataset.id);
            goTo("startTest");
        });
    }

    const retryButton = div.querySelector(".retryButton");

    if (retryButton) {
        retryButton.addEventListener("click", function () {
            localStorage.setItem("test_id", this.dataset.id);
            goTo("startTest");
        });
    }

    const viewResultButton = div.querySelector(".viewResultButton");

    if (viewResultButton) {
        viewResultButton.addEventListener("click", function () {
            localStorage.setItem("test_id", this.dataset.id);
            goTo("reviewTest");
        });
    }

}




