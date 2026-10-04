const STORAGE_KEY = "study_streak_activity";

let activities = JSON.parse(
    localStorage.getItem(STORAGE_KEY)
) || {};

let selectedYear = new Date().getFullYear();

let selectedDate = null;


// DOM
const activityDate = document.getElementById("activityDate");
const studyHours = document.getElementById("studyHours");
const codingHours = document.getElementById("codingHours");
const dsaProblems = document.getElementById("dsaProblems");
const activityNote = document.getElementById("activityNote");

const heatmap = document.getElementById("heatmap");
const monthRow = document.getElementById("monthRow");
const yearLabel = document.getElementById("yearLabel");

const dayDetails = document.getElementById("dayDetails");


// Today's date
function getTodayString() {

    const today = new Date();

    return today.toISOString().split("T")[0];
}


activityDate.value = getTodayString();


// Save
function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(activities)
    );
}


// Date formatting
function formatDate(dateString) {

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


// Activity intensity
function getIntensity(activity) {

    if (!activity) {
        return 0;
    }

    const study = Number(activity.study) || 0;
    const coding = Number(activity.coding) || 0;
    const dsa = Number(activity.dsa) || 0;

    const score =
        study * 2 +
        coding * 2 +
        dsa;

    if (score === 0) return 0;
    if (score <= 3) return 1;
    if (score <= 7) return 2;
    if (score <= 12) return 3;

    return 4;
}


// Generate heatmap
function renderHeatmap() {

    heatmap.innerHTML = "";
    monthRow.innerHTML = "";

    yearLabel.textContent = selectedYear;

    const start = new Date(
        selectedYear,
        0,
        1
    );

    const end = new Date(
        selectedYear,
        11,
        31
    );

    /*
       Start from Sunday so the heatmap
       always has seven rows.
    */

    const firstDay = new Date(start);

    firstDay.setDate(
        start.getDate() - start.getDay()
    );

    const lastDay = new Date(end);

    lastDay.setDate(
        end.getDate() + (6 - end.getDay())
    );


    // Month labels
    for (let month = 0; month < 12; month++) {

        const monthName = new Date(
            selectedYear,
            month,
            1
        ).toLocaleDateString("en-US", {
            month: "short"
        });

        const monthElement =
            document.createElement("span");

        monthElement.textContent = monthName;

        monthRow.appendChild(monthElement);
    }


    // Days
    let current = new Date(firstDay);

    while (current <= lastDay) {

        const dateString =
            current.toISOString().split("T")[0];

        const cell =
            document.createElement("div");

        cell.classList.add("heat-cell");

        const activity =
            activities[dateString];

        const intensity =
            getIntensity(activity);

        cell.classList.add(
            `level-${intensity}`
        );

        cell.title =
            `${formatDate(dateString)} • ${
                activity
                    ? `${activity.study}h study, ${activity.coding}h coding, ${activity.dsa} DSA`
                    : "No activity"
            }`;

        // Don't display dates outside selected year
        if (
            current.getFullYear() !== selectedYear
        ) {

            cell.style.opacity = "0.25";

        }


        cell.addEventListener(
            "click",
            () => {

                if (
                    current.getFullYear() === selectedYear
                ) {

                    showDayDetails(dateString);

                }

            }
        );


        heatmap.appendChild(cell);

        current.setDate(
            current.getDate() + 1
        );
    }
}


// Show selected day
function showDayDetails(dateString) {

    selectedDate = dateString;

    const activity =
        activities[dateString];

    document.getElementById(
        "selectedDate"
    ).textContent = formatDate(dateString);

    document.getElementById(
        "detailStudy"
    ).textContent =
        `${activity?.study || 0}h`;

    document.getElementById(
        "detailCoding"
    ).textContent =
        `${activity?.coding || 0}h`;

    document.getElementById(
        "detailDSA"
    ).textContent =
        activity?.dsa || 0;

    document.getElementById(
        "detailNote"
    ).textContent =
        activity?.note || "—";

    dayDetails.classList.remove(
        "hidden"
    );

    dayDetails.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


// Save activity
document
    .getElementById("saveActivity")
    .addEventListener("click", () => {

        const date =
            activityDate.value;

        if (!date) {

            alert("Please select a date.");

            return;
        }


        const study =
            Number(studyHours.value) || 0;

        const coding =
            Number(codingHours.value) || 0;

        const dsa =
            Number(dsaProblems.value) || 0;

        const note =
            activityNote.value.trim();


        if (
            study === 0 &&
            coding === 0 &&
            dsa === 0
        ) {

            alert(
                "Add at least one activity before saving."
            );

            return;
        }


        activities[date] = {

            study,
            coding,
            dsa,
            note

        };


        saveData();

        selectedYear =
            new Date(
                date + "T00:00:00"
            ).getFullYear();


        renderAll();

        showDayDetails(date);


        // Reset form
        studyHours.value = "";
        codingHours.value = "";
        dsaProblems.value = "";
        activityNote.value = "";

    });


// Delete activity
document
    .getElementById("deleteActivity")
    .addEventListener("click", () => {

        if (!selectedDate) return;


        const confirmDelete =
            confirm(
                "Delete this day's activity?"
            );


        if (!confirmDelete) return;


        delete activities[selectedDate];

        saveData();

        dayDetails.classList.add(
            "hidden"
        );

        renderAll();

    });


// Calculate streak
function calculateStreaks() {

    const dates =
        Object.keys(activities)
            .filter(date => {

                const activity =
                    activities[date];

                return getIntensity(activity) > 0;

            })
            .sort();


    if (dates.length === 0) {

        return {
            current: 0,
            longest: 0
        };

    }


    let longest = 1;
    let currentRun = 1;


    for (let i = 1; i < dates.length; i++) {

        const previous =
            new Date(
                dates[i - 1] + "T00:00:00"
            );

        const current =
            new Date(
                dates[i] + "T00:00:00"
            );


        const difference =
            Math.round(
                (
                    current - previous
                ) /
                (1000 * 60 * 60 * 24)
            );


        if (difference === 1) {

            currentRun++;

            longest =
                Math.max(
                    longest,
                    currentRun
                );

        } else {

            currentRun = 1;

        }

    }


    // Current streak
    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const yesterday =
        new Date(today);

    yesterday.setDate(
        yesterday.getDate() - 1
    );


    let streakStart = null;


    const todayString =
        today.toISOString()
            .split("T")[0];

    const yesterdayString =
        yesterday.toISOString()
            .split("T")[0];


    if (activities[todayString]) {

        streakStart =
            todayString;

    } else if (activities[yesterdayString]) {

        streakStart =
            yesterdayString;

    }


    let current = 0;


    if (streakStart) {

        let checkDate =
            new Date(
                streakStart + "T00:00:00"
            );


        while (true) {

            const dateString =
                checkDate
                    .toISOString()
                    .split("T")[0];


            if (
                activities[dateString] &&
                getIntensity(
                    activities[dateString]
                ) > 0
            ) {

                current++;

                checkDate.setDate(
                    checkDate.getDate() - 1
                );

            } else {

                break;

            }

        }

    }


    return {
        current,
        longest
    };
}


// Calculate totals
function calculateTotals() {

    let study = 0;
    let coding = 0;
    let dsa = 0;


    Object.values(
        activities
    ).forEach(activity => {

        study +=
            Number(activity.study) || 0;

        coding +=
            Number(activity.coding) || 0;

        dsa +=
            Number(activity.dsa) || 0;

    });


    return {
        study,
        coding,
        dsa
    };
}


// Weekly stats
function calculateWeekly() {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const day =
        today.getDay();


    const monday =
        new Date(today);

    monday.setDate(
        today.getDate() -
        (day === 0 ? 6 : day - 1)
    );


    let study = 0;
    let coding = 0;
    let dsa = 0;


    for (let i = 0; i < 7; i++) {

        const date =
            new Date(monday);

        date.setDate(
            monday.getDate() + i
        );


        const dateString =
            date.toISOString()
                .split("T")[0];


        const activity =
            activities[dateString];


        if (activity) {

            study +=
                Number(activity.study) || 0;

            coding +=
                Number(activity.coding) || 0;

            dsa +=
                Number(activity.dsa) || 0;

        }

    }


    return {
        study,
        coding,
        dsa
    };
}


// Update stats
function updateStats() {

    const streaks =
        calculateStreaks();

    const totals =
        calculateTotals();


    document.getElementById(
        "currentStreak"
    ).textContent =
        `${streaks.current} days`;

    document.getElementById(
        "longestStreak"
    ).textContent =
        `${streaks.longest} days`;

    document.getElementById(
        "heroStreak"
    ).textContent =
        streaks.current;

    document.getElementById(
        "totalStudy"
    ).textContent =
        `${totals.study}h`;

    document.getElementById(
        "totalDSA"
    ).textContent =
        totals.dsa;


    updateWeekly();
}


// Weekly UI
function updateWeekly() {

    const week =
        calculateWeekly();


    document.getElementById(
        "weekStudy"
    ).textContent =
        `${week.study}h`;

    document.getElementById(
        "weekCoding"
    ).textContent =
        `${week.coding}h`;

    document.getElementById(
        "weekDSA"
    ).textContent =
        week.dsa;


    document.getElementById(
        "studyBar"
    ).style.width =
        `${Math.min(
            (week.study / 20) * 100,
            100
        )}%`;


    document.getElementById(
        "codingBar"
    ).style.width =
        `${Math.min(
            (week.coding / 20) * 100,
            100
        )}%`;


    document.getElementById(
        "dsaBar"
    ).style.width =
        `${Math.min(
            (week.dsa / 30) * 100,
            100
        )}%`;
}


// Render everything
function renderAll() {

    renderHeatmap();

    updateStats();

}


// Previous year
document
    .getElementById("prevYear")
    .addEventListener("click", () => {

        selectedYear--;

        renderHeatmap();

    });


// Next year
document
    .getElementById("nextYear")
    .addEventListener("click", () => {

        const currentYear =
            new Date().getFullYear();


        if (
            selectedYear < currentYear
        ) {

            selectedYear++;

            renderHeatmap();

        }

    });


// Load demo
document
    .getElementById("loadDemo")
    .addEventListener("click", () => {

        const today =
            new Date();


        for (let i = 0; i < 25; i++) {

            const date =
                new Date(today);

            date.setDate(
                today.getDate() - i
            );


            // Randomly skip some days
            if (
                Math.random() > 0.2
            ) {

                const dateString =
                    date.toISOString()
                        .split("T")[0];


                activities[dateString] = {

                    study:
                        Number(
                            (
                                Math.random() * 3 + 1
                            ).toFixed(1)
                        ),

                    coding:
                        Number(
                            (
                                Math.random() * 2 + 0.5
                            ).toFixed(1)
                        ),

                    dsa:
                        Math.floor(
                            Math.random() * 7
                        ),

                    note:
                        "Worked on coding and learning"

                };

            }

        }


        saveData();

        selectedYear =
            today.getFullYear();

        renderAll();

        alert(
            "Demo activity loaded!"
        );

    });


// Clear all
document
    .getElementById("clearAll")
    .addEventListener("click", () => {

        if (
            Object.keys(activities).length === 0
        ) {

            alert(
                "There is no activity to clear."
            );

            return;
        }


        const confirmClear =
            confirm(
                "Are you sure you want to delete all activity?"
            );


        if (!confirmClear) return;


        activities = {};

        saveData();

        dayDetails.classList.add(
            "hidden"
        );

        renderAll();

    });


// Initial render
renderAll();