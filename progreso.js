"use strict";


const WORKOUTS_STORAGE_KEY =
    "gymTrackWorkoutsV1";

const GOALS_STORAGE_KEY =
    "gymTrackGoalsV1";


const MUSCLE_GROUPS = [
    "Pecho",
    "Espalda",
    "Bíceps",
    "Tríceps",
    "Hombro",
    "Pierna",
    "Abdomen"
];



const currentStreakElement =
    document.getElementById("currentStreak");

const bestStreakElement =
    document.getElementById("bestStreak");

const totalTrainingDaysElement =
    document.getElementById("totalTrainingDays");

const activeGoalsCountElement =
    document.getElementById("activeGoalsCount");

const completedGoalsCountElement =
    document.getElementById("completedGoalsCount");

const todayStatusElement =
    document.getElementById("todayStatus");

const weekCalendar =
    document.getElementById("weekCalendar");

const goalsList =
    document.getElementById("goalsList");

const goalsEmptyState =
    document.getElementById("goalsEmptyState");

const achievementsGrid =
    document.getElementById("achievementsGrid");


const newGoalButton =
    document.getElementById("newGoalButton");

const emptyNewGoalButton =
    document.getElementById("emptyNewGoalButton");

const goalModal =
    document.getElementById("goalModal");

const goalForm =
    document.getElementById("goalForm");

const goalMuscleGroup =
    document.getElementById("goalMuscleGroup");

const goalExercise =
    document.getElementById("goalExercise");

const exerciseSuggestions =
    document.getElementById("exerciseSuggestions");

const goalIncrease =
    document.getElementById("goalIncrease");

const goalDeadline =
    document.getElementById("goalDeadline");

const goalInitialWeight =
    document.getElementById("goalInitialWeight");

const initialWeightHint =
    document.getElementById("initialWeightHint");

const goalPreview =
    document.getElementById("goalPreview");

const progressToast =
    document.getElementById("progressToast");


let workouts =
    loadWorkouts();

let goals =
    loadGoals();

let toastTimer = null;



initializeProgress();



function initializeProgress() {

    renderAll();


    newGoalButton.addEventListener(
        "click",
        openGoalModal
    );


    emptyNewGoalButton.addEventListener(
        "click",
        openGoalModal
    );


    goalForm.addEventListener(
        "submit",
        handleGoalSubmit
    );


    goalsList.addEventListener(
        "click",
        handleGoalActions
    );


    goalMuscleGroup.addEventListener(
        "change",
        () => {

            updateExerciseSuggestions();

            detectInitialWeight();

            updateGoalPreview();

        }
    );


    goalExercise.addEventListener(
        "input",
        () => {

            detectInitialWeight();

            updateGoalPreview();

        }
    );


    goalIncrease.addEventListener(
        "input",
        updateGoalPreview
    );


    goalInitialWeight.addEventListener(
        "input",
        updateGoalPreview
    );


    goalDeadline.addEventListener(
        "change",
        updateGoalPreview
    );


    document
        .querySelectorAll(
            "[data-close-goal-modal]"
        )
        .forEach(
            (element) => {

                element.addEventListener(
                    "click",
                    closeGoalModal
                );

            }
        );


    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape" &&
                goalModal.classList.contains(
                    "is-open"
                )
            ) {

                closeGoalModal();

            }

        }
    );

}



function renderAll() {

    workouts =
        loadWorkouts();

    goals =
        loadGoals();


    const streakStats =
        calculateStreakStats(
            workouts
        );


    const goalStats =
        goals.map(
            (goal) =>
                calculateGoalProgress(
                    goal,
                    workouts
                )
        );


    currentStreakElement.textContent =
        formatDays(
            streakStats.currentStreak
        );


    bestStreakElement.textContent =
        formatDays(
            streakStats.bestStreak
        );


    totalTrainingDaysElement.textContent =
        streakStats.totalTrainingDays;


    const activeGoals =
        goalStats.filter(
            (goal) =>
                goal.status === "active"
        ).length;


    const completedGoals =
        goalStats.filter(
            (goal) =>
                goal.status === "completed"
        ).length;


    activeGoalsCountElement.textContent =
        activeGoals;


    completedGoalsCountElement.textContent =
        completedGoals;


    todayStatusElement.textContent =
        streakStats.todayCompleted
            ? "Hoy completado ✓"
            : "Hoy pendiente";


    todayStatusElement.classList.toggle(
        "completed",
        streakStats.todayCompleted
    );


    renderWeekCalendar(
        streakStats.trainingDates
    );


    renderGoals(
        goalStats
    );


    renderAchievements(
        streakStats,
        completedGoals
    );

}



// ==============================
// RACHA
// ==============================

function calculateStreakStats(
    workoutList
) {

    const trainingDates =
        new Set(
            workoutList
                .map(
                    (workout) =>
                        workout.date
                )
                .filter(
                    isValidIsoDate
                )
        );


    const sortedDates =
        Array.from(
            trainingDates
        ).sort();


    const today =
        getLocalIsoDate();


    const yesterday =
        addDaysToIso(
            today,
            -1
        );


    const todayCompleted =
        trainingDates.has(
            today
        );


    let currentStreak = 0;


    let cursor =
        todayCompleted
            ? today
            : yesterday;


    while (
        trainingDates.has(
            cursor
        )
    ) {

        currentStreak++;

        cursor =
            addDaysToIso(
                cursor,
                -1
            );

    }



    let bestStreak = 0;

    let runningStreak = 0;

    let previousDate = null;


    sortedDates.forEach(
        (date) => {

            if (
                previousDate &&
                addDaysToIso(
                    previousDate,
                    1
                ) === date
            ) {

                runningStreak++;

            }

            else {

                runningStreak = 1;

            }


            bestStreak =
                Math.max(
                    bestStreak,
                    runningStreak
                );


            previousDate =
                date;

        }
    );


    return {

        trainingDates,

        currentStreak,

        bestStreak,

        totalTrainingDays:
            trainingDates.size,

        todayCompleted

    };

}



function renderWeekCalendar(
    trainingDates
) {

    const today =
        getLocalIsoDate();


    const dateToday =
        isoToLocalDate(
            today
        );


    const monday =
        new Date(
            dateToday
        );


    const day =
        monday.getDay();


    const distance =
        day === 0
            ? -6
            : 1 - day;


    monday.setDate(
        monday.getDate() +
        distance
    );


    const labels = [
        "L",
        "M",
        "X",
        "J",
        "V",
        "S",
        "D"
    ];


    weekCalendar.innerHTML =
        labels
            .map(
                (label, index) => {

                    const date =
                        new Date(
                            monday
                        );


                    date.setDate(
                        monday.getDate() +
                        index
                    );


                    const isoDate =
                        localDateToIso(
                            date
                        );


                    const completed =
                        trainingDates.has(
                            isoDate
                        );


                    const isToday =
                        isoDate === today;


                    const isFuture =
                        isoDate > today;


                    return `

                        <div
                            class="
                                week-day
                                ${completed ? "completed" : ""}
                                ${isToday ? "today" : ""}
                                ${isFuture ? "future" : ""}
                            "
                        >

                            <span class="week-day-label">
                                ${label}
                            </span>

                            <span class="week-day-circle">
                                ${completed ? "✓" : ""}
                            </span>

                            <small>
                                ${String(
                                    date.getDate()
                                ).padStart(2, "0")}
                            </small>

                        </div>

                    `;

                }
            )
            .join("");

}



// ==============================
// MODAL DE META
// ==============================

function openGoalModal() {

    goalForm.reset();

    clearErrors();


    const today =
        getLocalIsoDate();


    goalDeadline.min =
        today;


    goalDeadline.value =
        addDaysToIso(
            today,
            30
        );


    goalInitialWeight.value =
        "";


    goalInitialWeight.readOnly =
        false;


    exerciseSuggestions.innerHTML =
        "";


    initialWeightHint.textContent =
        "Selecciona el grupo y escribe el ejercicio.";


    goalPreview.innerHTML =
        "";


    goalPreview.classList.add(
        "hidden"
    );


    goalModal.classList.add(
        "is-open"
    );


    goalModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );

}



function closeGoalModal() {

    goalModal.classList.remove(
        "is-open"
    );


    goalModal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );


    clearErrors();

}



// ==============================
// EJERCICIOS SUGERIDOS
// ==============================

function updateExerciseSuggestions() {

    const muscle =
        goalMuscleGroup.value;


    if (
        !MUSCLE_GROUPS.includes(
            muscle
        )
    ) {

        exerciseSuggestions.innerHTML =
            "";

        return;

    }


    const exercises =
        new Map();


    workouts
        .filter(
            (workout) =>
                workout.muscleGroup ===
                muscle
        )
        .sort(
            compareWorkoutDatesDesc
        )
        .forEach(
            (workout) => {

                const key =
                    normalizeText(
                        workout.exercise
                    );


                if (
                    !exercises.has(
                        key
                    )
                ) {

                    exercises.set(
                        key,
                        workout.exercise
                    );

                }

            }
        );


    exerciseSuggestions.innerHTML =
        Array.from(
            exercises.values()
        )
        .map(
            (exercise) =>
                `<option value="${escapeHtml(exercise)}"></option>`
        )
        .join("");

}



// ==============================
// PESO INICIAL AUTOMÁTICO
// ==============================

function detectInitialWeight() {

    const muscle =
        goalMuscleGroup.value;


    const exercise =
        goalExercise
            .value
            .trim();


    if (
        !MUSCLE_GROUPS.includes(
            muscle
        ) ||
        !exercise
    ) {

        goalInitialWeight.value =
            "";


        goalInitialWeight.readOnly =
            false;


        initialWeightHint.textContent =
            "Selecciona el grupo y escribe el ejercicio.";


        return;

    }


    const latestWorkout =
        findLatestWorkout(
            muscle,
            exercise
        );


    if (latestWorkout) {

        goalInitialWeight.value =
            latestWorkout.weight;


        goalInitialWeight.readOnly =
            true;


        initialWeightHint.textContent =
            `Peso detectado automáticamente desde el ${formatDate(latestWorkout.date)}.`;

    }

    else {

        goalInitialWeight.readOnly =
            false;


        initialWeightHint.textContent =
            "No hay registros anteriores. Introduce el peso inicial manualmente.";

    }

}



function findLatestWorkout(
    muscle,
    exercise
) {

    const normalizedExercise =
        normalizeText(
            exercise
        );


    return workouts
        .filter(
            (workout) =>

                workout.muscleGroup ===
                    muscle &&

                normalizeText(
                    workout.exercise
                ) ===
                    normalizedExercise
        )
        .sort(
            compareWorkoutDatesDesc
        )[0] || null;

}



// ==============================
// PREVISUALIZAR META
// ==============================

function updateGoalPreview() {

    const initial =
        parseDecimal(
            goalInitialWeight.value
        );


    const increase =
        parseDecimal(
            goalIncrease.value
        );


    const deadline =
        goalDeadline.value;


    if (
        !(initial > 0) ||
        !(increase > 0) ||
        !isValidIsoDate(
            deadline
        )
    ) {

        goalPreview.classList.add(
            "hidden"
        );


        return;

    }


    const target =
        roundToOneDecimal(
            initial +
            increase
        );


    goalPreview.innerHTML = `

        <span>
            Objetivo calculado
        </span>

        <strong>
            ${formatNumber(initial)} kg
            →
            ${formatNumber(target)} kg
        </strong>

        <small>
            Antes del
            ${formatDate(deadline)}
        </small>

    `;


    goalPreview.classList.remove(
        "hidden"
    );

}



// ==============================
// GUARDAR META
// ==============================

function handleGoalSubmit(
    event
) {

    event.preventDefault();


    const data =
        validateGoal();


    if (!data) {
        return;
    }


    const goal = {

        id:
            createUniqueId(),

        muscleGroup:
            data.muscleGroup,

        exercise:
            data.exercise,

        initialWeight:
            data.initialWeight,

        targetIncrease:
            data.targetIncrease,

        targetWeight:
            roundToOneDecimal(
                data.initialWeight +
                data.targetIncrease
            ),

        startDate:
            getLocalIsoDate(),

        deadline:
            data.deadline

    };


    goals.push(
        goal
    );


    saveGoals();


    closeGoalModal();


    renderAll();


    showToast(
        `🎯 Meta creada: ${goal.exercise}.`
    );

}



// ==============================
// VALIDAR META
// ==============================

function validateGoal() {

    clearErrors();


    const muscleGroup =
        goalMuscleGroup.value;


    const exercise =
        goalExercise
            .value
            .trim();


    const initialWeight =
        parseDecimal(
            goalInitialWeight.value
        );


    const targetIncrease =
        parseDecimal(
            goalIncrease.value
        );


    const deadline =
        goalDeadline.value;


    const today =
        getLocalIsoDate();


    let valid = true;


    if (
        !MUSCLE_GROUPS.includes(
            muscleGroup
        )
    ) {

        setError(
            goalMuscleGroup,
            "goalMuscleGroupError",
            "Selecciona un grupo muscular."
        );

        valid = false;

    }


    if (!exercise) {

        setError(
            goalExercise,
            "goalExerciseError",
            "Escribe el ejercicio."
        );

        valid = false;

    }


    if (
        !(initialWeight > 0)
    ) {

        setError(
            goalInitialWeight,
            "goalInitialWeightError",
            "Introduce un peso inicial válido."
        );

        valid = false;

    }


    if (
        !(targetIncrease > 0)
    ) {

        setError(
            goalIncrease,
            "goalIncreaseError",
            "Introduce cuánto quieres aumentar."
        );

        valid = false;

    }


    if (
        !isValidIsoDate(
            deadline
        ) ||
        deadline < today
    ) {

        setError(
            goalDeadline,
            "goalDeadlineError",
            "Selecciona una fecha válida."
        );

        valid = false;

    }


    if (!valid) {
        return null;
    }


    return {

        muscleGroup,

        exercise,

        initialWeight:
            roundToOneDecimal(
                initialWeight
            ),

        targetIncrease:
            roundToOneDecimal(
                targetIncrease
            ),

        deadline

    };

}



// ==============================
// CALCULAR PROGRESO DE META
// ==============================

function calculateGoalProgress(
    goal,
    workoutList
) {

    const matchingWorkouts =
        workoutList.filter(
            (workout) =>

                workout.muscleGroup ===
                    goal.muscleGroup &&

                normalizeText(
                    workout.exercise
                ) ===
                    normalizeText(
                        goal.exercise
                    ) &&

                workout.date >=
                    goal.startDate &&

                workout.date <=
                    goal.deadline
        );


    const bestWeight =
        matchingWorkouts.reduce(
            (best, workout) =>

                Math.max(
                    best,
                    Number(
                        workout.weight
                    )
                ),

            Number(
                goal.initialWeight
            )
        );


    const rawProgress =
        Math.max(
            0,
            bestWeight -
            Number(
                goal.initialWeight
            )
        );


    const achievedIncrease =
        Math.min(
            rawProgress,
            Number(
                goal.targetIncrease
            )
        );


    const percentage =
        Math.min(
            100,
            Math.round(
                rawProgress /
                Number(
                    goal.targetIncrease
                ) *
                100
            )
        );


    const completed =
        bestWeight >=
        Number(
            goal.targetWeight
        );


    const today =
        getLocalIsoDate();


    let status =
        "active";


    if (completed) {

        status =
            "completed";

    }

    else if (
        today >
        goal.deadline
    ) {

        status =
            "finished";

    }


    return {

        ...goal,

        bestWeight:
            roundToOneDecimal(
                bestWeight
            ),

        achievedIncrease:
            roundToOneDecimal(
                achievedIncrease
            ),

        percentage,

        status,

        daysRemaining:
            differenceInDays(
                today,
                goal.deadline
            )

    };

}



// ==============================
// MOSTRAR METAS
// ==============================

function renderGoals(
    goalStats
) {

    if (
        goalStats.length === 0
    ) {

        goalsList.innerHTML =
            "";


        goalsList.classList.add(
            "hidden"
        );


        goalsEmptyState.classList.remove(
            "hidden"
        );


        return;

    }


    goalsList.classList.remove(
        "hidden"
    );


    goalsEmptyState.classList.add(
        "hidden"
    );


    const order = {

        active: 0,

        completed: 1,

        finished: 2

    };


    goalStats.sort(
        (a, b) =>
            order[a.status] -
            order[b.status]
    );


    goalsList.innerHTML =
        goalStats
            .map(
                createGoalCard
            )
            .join("");

}



function createGoalCard(
    goal
) {

    let statusText =
        "ACTIVA";


    if (
        goal.status ===
        "completed"
    ) {

        statusText =
            "✓ META COMPLETADA";

    }


    if (
        goal.status ===
        "finished"
    ) {

        statusText =
            "FINALIZADA";

    }


    let daysText =
        `Quedan ${goal.daysRemaining} días`;


    if (
        goal.daysRemaining === 1
    ) {

        daysText =
            "Queda 1 día";

    }


    if (
        goal.daysRemaining === 0
    ) {

        daysText =
            "Último día";

    }


    if (
        goal.status ===
        "completed"
    ) {

        daysText =
            "Objetivo alcanzado";

    }


    if (
        goal.status ===
        "finished"
    ) {

        daysText =
            "Plazo finalizado";

    }


    return `

        <article
            class="goal-card ${goal.status}"
        >

            <div class="goal-card-top">

                <div>

                    <span
                        class="goal-status ${goal.status}"
                    >
                        ${statusText}
                    </span>

                    <h3>
                        ${escapeHtml(goal.exercise)}
                    </h3>

                    <p>
                        ${escapeHtml(goal.muscleGroup)}
                    </p>

                </div>


                <button
                    class="goal-delete-button"
                    type="button"
                    data-action="delete-goal"
                    data-id="${goal.id}"
                >
                    Eliminar
                </button>

            </div>


            <div class="goal-weight-route">

                <span>
                    ${formatNumber(goal.initialWeight)} kg
                </span>

                <span>
                    →
                </span>

                <strong>
                    ${formatNumber(goal.targetWeight)} kg
                </strong>

            </div>


            <div class="goal-progress-row">

                <div class="goal-progress-track">

                    <div
                        class="goal-progress-fill"
                        style="width: ${goal.percentage}%"
                    ></div>

                </div>

                <strong>
                    ${goal.percentage}%
                </strong>

            </div>


            <div class="goal-current-value">

                <strong>
                    ${formatNumber(goal.bestWeight)}
                    /
                    ${formatNumber(goal.targetWeight)}
                    kg
                </strong>

                <span>
                    +${formatNumber(goal.achievedIncrease)}
                    kg conseguidos de
                    +${formatNumber(goal.targetIncrease)}
                    kg
                </span>

            </div>


            <div class="goal-deadline">

                <span>
                    📅 ${daysText}
                </span>

                <small>
                    Fecha límite:
                    ${formatDate(goal.deadline)}
                </small>

            </div>

        </article>

    `;

}



// ==============================
// ELIMINAR META
// ==============================

function handleGoalActions(
    event
) {

    const button =
        event.target.closest(
            "[data-action='delete-goal']"
        );


    if (!button) {
        return;
    }


    const id =
        button.dataset.id;


    const goal =
        goals.find(
            (item) =>
                item.id === id
        );


    if (!goal) {
        return;
    }


    const confirmed =
        window.confirm(
            `¿Eliminar la meta de ${goal.exercise}?`
        );


    if (!confirmed) {
        return;
    }


    goals =
        goals.filter(
            (item) =>
                item.id !== id
        );


    saveGoals();


    renderAll();


    showToast(
        "Meta eliminada."
    );

}



// ==============================
// LOGROS
// ==============================

function renderAchievements(
    streakStats,
    completedGoals
) {

    const achievements = [

        {

            icon: "🔥",

            title:
                "Racha de 7 días",

            current:
                streakStats.bestStreak,

            target: 7

        },

        {

            icon: "🏆",

            title:
                "Primera meta",

            current:
                completedGoals,

            target: 1

        },

        {

            icon: "💪",

            title:
                "10 días entrenados",

            current:
                streakStats.totalTrainingDays,

            target: 10

        },

        {

            icon: "🎯",

            title:
                "5 metas completadas",

            current:
                completedGoals,

            target: 5

        }

    ];


    achievementsGrid.innerHTML =
        achievements
            .map(
                (achievement) => {

                    const unlocked =
                        achievement.current >=
                        achievement.target;


                    return `

                        <article
                            class="
                                achievement-card
                                ${unlocked
                                    ? "unlocked"
                                    : "locked"}
                            "
                        >

                            <span class="achievement-icon">
                                ${achievement.icon}
                            </span>

                            <div>

                                <strong>
                                    ${achievement.title}
                                </strong>

                                <p>

                                    ${
                                        unlocked

                                            ? "Logro conseguido."

                                            : `${achievement.current}/${achievement.target}`

                                    }

                                </p>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

}



// ==============================
// LOCAL STORAGE
// ==============================

function loadWorkouts() {

    try {

        const stored =
            localStorage.getItem(
                WORKOUTS_STORAGE_KEY
            );


        const parsed =
            stored
                ? JSON.parse(
                    stored
                )
                : [];


        return Array.isArray(
            parsed
        )
            ? parsed
            : [];

    }

    catch (error) {

        console.error(
            error
        );

        return [];

    }

}



function loadGoals() {

    try {

        const stored =
            localStorage.getItem(
                GOALS_STORAGE_KEY
            );


        const parsed =
            stored
                ? JSON.parse(
                    stored
                )
                : [];


        return Array.isArray(
            parsed
        )
            ? parsed
            : [];

    }

    catch (error) {

        console.error(
            error
        );

        return [];

    }

}



function saveGoals() {

    localStorage.setItem(

        GOALS_STORAGE_KEY,

        JSON.stringify(
            goals
        )

    );

}



// ==============================
// ERRORES
// ==============================

function setError(
    input,
    id,
    message
) {

    input.classList.add(
        "invalid"
    );


    document.getElementById(
        id
    ).textContent =
        message;

}



function clearErrors() {

    goalForm
        .querySelectorAll(
            ".invalid"
        )
        .forEach(
            (element) =>

                element.classList.remove(
                    "invalid"
                )
        );


    goalForm
        .querySelectorAll(
            ".field-error"
        )
        .forEach(
            (element) =>

                element.textContent =
                    ""
        );

}



// ==============================
// TOAST
// ==============================

function showToast(
    message
) {

    clearTimeout(
        toastTimer
    );


    progressToast.textContent =
        message;


    progressToast.classList.add(
        "show"
    );


    toastTimer =
        setTimeout(
            () => {

                progressToast.classList.remove(
                    "show"
                );

            },
            2800
        );

}



// ==============================
// UTILIDADES
// ==============================

function normalizeText(
    value
) {

    return String(
        value
    )

        .trim()

        .toLocaleLowerCase(
            "es-ES"
        )

        .normalize(
            "NFD"
        )

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .replace(
            /\s+/g,
            " "
        );

}



function compareWorkoutDatesDesc(
    a,
    b
) {

    return b.date.localeCompare(
        a.date
    );

}



function parseDecimal(
    value
) {

    return Number(
        String(
            value
        ).replace(
            ",",
            "."
        )
    );

}



function roundToOneDecimal(
    value
) {

    return Math.round(
        (
            Number(value) +
            Number.EPSILON
        ) * 10
    ) / 10;

}



function formatNumber(
    value
) {

    return new Intl.NumberFormat(
        "es-ES",
        {
            maximumFractionDigits: 1
        }
    ).format(
        value
    );

}



function formatDays(
    number
) {

    return `${number} ${
        number === 1
            ? "día"
            : "días"
    }`;

}



function getLocalIsoDate() {

    return localDateToIso(
        new Date()
    );

}



function localDateToIso(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}



function isoToLocalDate(
    iso
) {

    const [
        year,
        month,
        day
    ] =
        iso
            .split("-")
            .map(
                Number
            );


    return new Date(
        year,
        month - 1,
        day
    );

}



function addDaysToIso(
    iso,
    days
) {

    const date =
        isoToLocalDate(
            iso
        );


    date.setDate(
        date.getDate() +
        days
    );


    return localDateToIso(
        date
    );

}



function differenceInDays(
    from,
    to
) {

    const start =
        isoToLocalDate(
            from
        );


    const end =
        isoToLocalDate(
            to
        );


    return Math.round(
        (
            end -
            start
        ) /
        (
            1000 *
            60 *
            60 *
            24
        )
    );

}



function isValidIsoDate(
    value
) {

    return /^\d{4}-\d{2}-\d{2}$/.test(
        String(
            value
        )
    );

}



function formatDate(
    iso
) {

    return new Intl.DateTimeFormat(
        "es-ES"
    ).format(
        isoToLocalDate(
            iso
        )
    );

}



function createUniqueId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {

        return window.crypto.randomUUID();

    }


    return `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;

}



function escapeHtml(
    value
) {

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        value;


    return element.innerHTML;

}