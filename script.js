
"use strict";

// ========================================
// 1. GET HTML ELEMENTS
// ========================================

const studentForm = document.getElementById("studentForm");
const resultBox = document.getElementById("resultBox");
const formMessage = document.getElementById("formMessage");
const recordsList = document.getElementById("recordsList");
const downloadJsonButton = document.getElementById("downloadJson");
const clearRecordsButton = document.getElementById("clearRecords");

// Local Storage key
const STORAGE_KEY = "studentPortalRecords";

// Passing marks required in EACH subject
const PASS_MARKS = 35;

// Store the latest generated student result
let currentStudent = null;


// ========================================
// 2. LOCAL STORAGE FUNCTIONS
// ========================================

function getSavedRecords() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData === null) {
            return [];
        }

        const records = JSON.parse(savedData);

        return Array.isArray(records) ? records : [];
    } catch (error) {
        console.error("Unable to read saved records:", error);
        return [];
    }
}

function saveRecords(records) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        return true;
    } catch (error) {
        console.error("Unable to save records:", error);
        return false;
    }
}


// ========================================
// 3. HANDLE FORM SUBMISSION
// ========================================

studentForm.addEventListener("submit", function (event) {

    // Prevent the browser from reloading the page
    event.preventDefault();

    formMessage.textContent = "";
    currentStudent = null;
    downloadJsonButton.hidden = true;

    // Read and clean student details
    const name = document.getElementById("studentName")
        .value.trim();

    const email = document.getElementById("email")
        .value.trim();

    const phone = document.getElementById("phone")
        .value.trim();

    const course = document.getElementById("course").value;

    // Read marks
    const htmlInput = document.getElementById("htmlMarks").value;
    const cssInput = document.getElementById("cssMarks").value;
    const jsInput = document.getElementById("jsMarks").value;

    // ========================================
    // 4. JAVASCRIPT VALIDATION
    // ========================================

    if (name.length < 2 || name.length > 60) {
        showError("Student name must contain 2 to 60 characters.");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("Please enter a valid email address.");
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        showError("Phone number must contain exactly 10 digits.");
        return;
    }

    if (course === "") {
        showError("Please select a course.");
        return;
    }

    // Check empty fields before converting marks to numbers
    const markInputs = [htmlInput, cssInput, jsInput];

    if (markInputs.some(value => value.trim() === "")) {
        showError("Please enter marks for all three subjects.");
        return;
    }

    const htmlMarks = Number(htmlInput);
    const cssMarks = Number(cssInput);
    const jsMarks = Number(jsInput);

    const marks = [htmlMarks, cssMarks, jsMarks];

    // Marks must be whole numbers from 0 to 100
    const validMarks = marks.every(mark =>
        Number.isInteger(mark) &&
        mark >= 0 &&
        mark <= 100
    );

    if (!validMarks) {
        showError("Each subject's marks must be a whole number from 0 to 100.");
        return;
    }


    // ========================================
    // 5. CALCULATE TOTAL AND PERCENTAGE
    // ========================================

    const total = htmlMarks + cssMarks + jsMarks;
    const maxMarks = 300;

    const percentage = Number(
        ((total / maxMarks) * 100).toFixed(2)
    );


    // ========================================
    // 6. DETERMINE PASS OR FAIL
    // ========================================

    // Student must score at least 35 in every subject
    const status = marks.every(mark => mark >= PASS_MARKS)
        ? "Pass"
        : "Fail";


    // ========================================
    // 7. CREATE STUDENT OBJECT
    // ========================================

    const student = {
        id: createRecordId(),
        name: name,
        email: email,
        phone: phone,
        course: course,

        marks: {
            HTML: htmlMarks,
            CSS: cssMarks,
            JavaScript: jsMarks
        },

        total: total,
        maxMarks: maxMarks,
        percentage: percentage,
        status: status,
        passingMarksPerSubject: PASS_MARKS,
        generatedAt: new Date().toISOString()
    };

    currentStudent = student;


    // ========================================
    // 8. DISPLAY RESULT DYNAMICALLY
    // ========================================

    displayResult(student);


    // ========================================
    // 9. CONVERT OBJECT TO JSON
    // ========================================

    const jsonData = JSON.stringify(student, null, 2);

    console.log("Student object:", student);
    console.log("Student JSON:", jsonData);


    // ========================================
    // 10. SAVE RECORD IN LOCAL STORAGE
    // ========================================

    const records = getSavedRecords();

    records.unshift(student);

    const savedSuccessfully = saveRecords(records);

    if (savedSuccessfully) {
        formMessage.textContent =
            "Result generated and saved successfully.";

        formMessage.style.color = "#17683a";
    } else {
        formMessage.textContent =
            "Result generated, but could not be saved. Check browser storage settings.";

        formMessage.style.color = "#a52222";
    }

    downloadJsonButton.hidden = false;

    // Refresh the saved records displayed on the page
    displaySavedRecords();

});


// ========================================
// 11. SHOW VALIDATION ERROR
// ========================================

function showError(message) {
    formMessage.textContent = message;
    formMessage.style.color = "#a52222";
}


// ========================================
// 12. CREATE A RECORD ID
// ========================================

function createRecordId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}


// ========================================
// 13. DISPLAY THE STUDENT RESULT
// ========================================

function displayResult(student) {

    // Clear the previous result
    resultBox.replaceChildren();

    const details = document.createElement("div");
    details.className = "result-details";

    addText(details, "h3", "Student Details");

    addText(details, "p", "Name: " + student.name);
    addText(details, "p", "Email: " + student.email);
    addText(details, "p", "Phone: " + student.phone);
    addText(details, "p", "Course: " + student.course);

    addText(details, "h3", "Subject-wise Marks");

    // Create a marks table
    const table = document.createElement("table");
    table.className = "marks-table";

    const tableHead = document.createElement("thead");
    const headingRow = document.createElement("tr");

    ["Subject", "Marks", "Maximum Marks"].forEach(heading => {
        const th = document.createElement("th");
        th.textContent = heading;
        headingRow.appendChild(th);
    });

    tableHead.appendChild(headingRow);
    table.appendChild(tableHead);

    const tableBody = document.createElement("tbody");

    Object.entries(student.marks).forEach(([subject, mark]) => {

        const row = document.createElement("tr");

        [subject, String(mark), "100"].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });

    table.appendChild(tableBody);
    details.appendChild(table);

    addText(
        details,
        "p",
        "Total Marks: " + student.total + " / " + student.maxMarks
    );

    addText(
        details,
        "p",
        "Percentage: " + student.percentage + "%"
    );

    const statusBadge = document.createElement("span");
    statusBadge.className =
        "result-status " +
        (student.status === "Pass" ? "pass" : "fail");

    statusBadge.textContent = "Result: " + student.status;

    details.appendChild(statusBadge);

    addText(
        details,
        "p",
        "Passing rule: At least " +
        student.passingMarksPerSubject +
        " marks in each subject."
    );

    resultBox.appendChild(details);
}


// Helper to safely add text elements
function addText(parent, tagName, text) {
    const element = document.createElement(tagName);
    element.textContent = text;
    parent.appendChild(element);
}


// ========================================
// 14. DISPLAY SAVED RECORDS
// ========================================

function displaySavedRecords() {

    recordsList.replaceChildren();

    const records = getSavedRecords();

    if (records.length === 0) {
        addText(recordsList, "p", "No saved records yet.");
        recordsList.firstElementChild.className = "no-result";
        return;
    }

    records.forEach(student => {

        const card = document.createElement("article");
        card.className = "record-card";

        addText(card, "h3", student.name);
        addText(card, "p", "Course: " + student.course);
        addText(card, "p", "Email: " + student.email);
        addText(card, "p", "Total: " +
            student.total + " / " + student.maxMarks);

        addText(card, "p", "Percentage: " +
            student.percentage + "%");

        const statusBadge = document.createElement("span");

        statusBadge.className =
            "result-status " +
            (student.status === "Pass" ? "pass" : "fail");

        statusBadge.textContent = student.status;

        card.appendChild(statusBadge);
        recordsList.appendChild(card);
    });
}


// ========================================
// 15. DOWNLOAD RESULT AS A JSON FILE
// ========================================

downloadJsonButton.addEventListener("click", function () {

    if (!currentStudent) {
        showError("Generate a result before downloading JSON.");
        return;
    }

    const jsonData = JSON.stringify(currentStudent, null, 2);

    const blob = new Blob(
        [jsonData],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "student-result-" +
        currentStudent.id + ".json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
});


// ========================================
// 16. CLEAR ALL SAVED RECORDS
// ========================================

clearRecordsButton.addEventListener("click", function () {

    const confirmed = window.confirm(
        "Are you sure you want to delete all saved student records?"
    );

    if (!confirmed) {
        return;
    }

    try {
        localStorage.removeItem(STORAGE_KEY);

        currentStudent = null;
        downloadJsonButton.hidden = true;

        resultBox.replaceChildren();

        addText(
            resultBox,
            "p",
            "No result selected. Generate a new result using the form."
        );

        formMessage.textContent = "All saved records have been cleared.";
        formMessage.style.color = "#17683a";

        displaySavedRecords();

    } catch (error) {
        console.error("Unable to clear records:", error);

        showError("Could not clear records from Local Storage.");
    }
});


// ========================================
// 17. LOAD SAVED RECORDS WHEN PAGE OPENS
// ========================================

displaySavedRecords();
