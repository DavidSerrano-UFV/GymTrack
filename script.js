"use strict";


const STORAGE_KEY = "gymTrackWorkoutsV1";


const MUSCLE_GROUPS = [
  "Pecho",
  "Espalda",
  "Bíceps",
  "Tríceps",
  "Hombro",
  "Pierna",
  "Abdomen"

];


// ==============================
// ELEMENTOS DEL HTML
// ==============================

const homeView =
  document.getElementById("homeView");

const muscleView =
  document.getElementById("muscleView");

const muscleGrid =
  document.getElementById("muscleGrid");

const muscleTitle =
  document.getElementById("muscleTitle");

const muscleSummary =
  document.getElementById("muscleSummary");

const exerciseHistory =
  document.getElementById("exerciseHistory");

const emptyState =
  document.getElementById("emptyState");

const totalWorkouts =
  document.getElementById("totalWorkouts");


const brandButton =
  document.getElementById("brandButton");

const backButton =
  document.getElementById("backButton");

const addExerciseButton =
  document.getElementById("addExerciseButton");

const emptyAddButton =
  document.getElementById("emptyAddButton");


const exerciseModal =
  document.getElementById("exerciseModal");

const modalTitle =
  document.getElementById("modalTitle");

const modalMuscleLabel =
  document.getElementById("modalMuscleLabel");

const exerciseForm =
  document.getElementById("exerciseForm");

const saveExerciseButton =
  document.getElementById("saveExerciseButton");


const editingIdInput =
  document.getElementById("editingId");

const exerciseNameInput =
  document.getElementById("exerciseName");

const weightInput =
  document.getElementById("weight");

const setsInput =
  document.getElementById("sets");

const repsInput =
  document.getElementById("reps");

const workoutDateInput =
  document.getElementById("workoutDate");

const toast =
  document.getElementById("toast");


// ==============================
// ESTADO DE LA APLICACIÓN
// ==============================

let workouts = loadWorkouts();

let selectedMuscle = null;

let toastTimer = null;

let lastFocusedElement = null;


// Iniciamos la aplicación.
initializeApp();


// ==============================
// INICIALIZACIÓN
// ==============================

function initializeApp() {

  updateDashboardCounts();

  setDefaultDate();


  muscleGrid.addEventListener(
    "click",
    handleMuscleSelection
  );


  brandButton.addEventListener(
    "click",
    showHomeView
  );


  backButton.addEventListener(
    "click",
    showHomeView
  );


  addExerciseButton.addEventListener(
    "click",
    () => openExerciseModal()
  );


  emptyAddButton.addEventListener(
    "click",
    () => openExerciseModal()
  );


  exerciseForm.addEventListener(
    "submit",
    handleFormSubmit
  );


  exerciseHistory.addEventListener(
    "click",
    handleHistoryActions
  );


  document
    .querySelectorAll("[data-close-modal]")
    .forEach((element) => {

      element.addEventListener(
        "click",
        closeExerciseModal
      );

    });


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape" &&
        exerciseModal.classList.contains("is-open")
      ) {

        closeExerciseModal();

      }

    }
  );


  // Comprueba si venimos desde rutinas.html
  // y abre directamente el músculo correspondiente.
  openMuscleFromUrl();

}


// ==============================
// SELECCIÓN DEL MÚSCULO
// ==============================

function handleMuscleSelection(event) {

  const card =
    event.target.closest("[data-muscle]");


  if (!card) {
    return;
  }


  const muscle =
    card.dataset.muscle;


  if (!MUSCLE_GROUPS.includes(muscle)) {
    return;
  }


  selectedMuscle = muscle;

  showMuscleView();

}


// ==============================
// NAVEGACIÓN
// ==============================

function showHomeView() {

  selectedMuscle = null;


  // Elimina ?muscle=Pecho, ?muscle=Espalda, etc.
  try {

    const cleanUrl =
      window.location.href
        .split("?")[0]
        .split("#")[0];


    window.history.replaceState(
      null,
      "",
      cleanUrl
    );

  }
  catch (error) {

    console.warn(
      "No se pudo limpiar la URL:",
      error
    );

  }


  muscleView.classList.add(
    "hidden"
  );


  homeView.classList.remove(
    "hidden"
  );


  updateDashboardCounts();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


function showMuscleView() {

  if (!selectedMuscle) {
    return;
  }


  homeView.classList.add(
    "hidden"
  );


  muscleView.classList.remove(
    "hidden"
  );


  muscleTitle.textContent =
    selectedMuscle;


  renderSelectedMuscleHistory();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ==============================
// MOSTRAR HISTORIAL
// ==============================

function renderSelectedMuscleHistory() {

  const muscleWorkouts =
    workouts

      .filter(
        (workout) =>
          workout.muscleGroup ===
          selectedMuscle
      )

      .sort(
        (a, b) =>
          compareWorkoutDatesDesc(a, b)
      );


  muscleSummary.textContent =
    formatRecordCount(
      muscleWorkouts.length
    );


  // Si no hay entrenamientos.
  if (muscleWorkouts.length === 0) {

    exerciseHistory.innerHTML = "";


    exerciseHistory.classList.add(
      "hidden"
    );


    emptyState.classList.remove(
      "hidden"
    );


    return;
  }


  emptyState.classList.add(
    "hidden"
  );


  exerciseHistory.classList.remove(
    "hidden"
  );


  const groupedExercises =
    groupWorkoutsByExercise(
      muscleWorkouts
    );


  exerciseHistory.innerHTML =
    groupedExercises
      .map(createExerciseCardMarkup)
      .join("");

}


// ==============================
// AGRUPAR POR EJERCICIO
// ==============================

function groupWorkoutsByExercise(
  muscleWorkouts
) {

  const groups =
    new Map();


  muscleWorkouts.forEach(
    (workout) => {

      const key =
        normalizeExerciseName(
          workout.exercise
        );


      if (!groups.has(key)) {

        groups.set(
          key,
          []
        );

      }


      groups
        .get(key)
        .push(workout);

    }
  );


  return Array
    .from(groups.values())
    .sort(
      (groupA, groupB) => {

        const latestA =
          groupA[0];

        const latestB =
          groupB[0];


        return compareWorkoutDatesDesc(
          latestA,
          latestB
        );

      }
    );

}


// ==============================
// CREAR HTML DEL EJERCICIO
// ==============================

function createExerciseCardMarkup(
  exerciseRecords
) {

  const records =
    [...exerciseRecords]
      .sort(
        (a, b) =>
          compareWorkoutDatesDesc(a, b)
      );


  const latestRecord =
    records[0];


  const exerciseName =
    escapeHtml(
      latestRecord.exercise
    );


  const rows =
    records

      .map(
        (record) => `

          <tr>

            <td>
              <strong>
                ${formatDate(record.date)}
              </strong>
            </td>

            <td>
              ${formatNumber(record.weight)} kg
            </td>

            <td>
              ${record.sets}
            </td>

            <td>
              ${record.reps}
            </td>

            <td>

              <div class="row-actions">

                <button
                  class="edit-button"
                  type="button"
                  data-action="edit"
                  data-id="${record.id}"
                >
                  Editar
                </button>

                <button
                  class="danger-button"
                  type="button"
                  data-action="delete"
                  data-id="${record.id}"
                >
                  Eliminar
                </button>

              </div>

            </td>

          </tr>

        `
      )

      .join("");


  return `

    <article class="exercise-card">

      <header class="exercise-card-header">

        <div>

          <h2>
            ${exerciseName}
          </h2>

          <p>
            ${formatRecordCount(records.length)}
            en el historial
          </p>

        </div>


        <div class="latest-weight">

          <span>
            Último peso
          </span>

          <strong>
            ${formatNumber(latestRecord.weight)} kg
          </strong>

        </div>

      </header>


      <div class="table-wrapper">

        <table class="history-table">

          <thead>

            <tr>

              <th>
                Fecha
              </th>

              <th>
                Peso
              </th>

              <th>
                Series
              </th>

              <th>
                Reps.
              </th>

              <th aria-label="Acciones">
              </th>

            </tr>

          </thead>


          <tbody>

            ${rows}

          </tbody>

        </table>

      </div>

    </article>

  `;

}


// ==============================
// ABRIR FORMULARIO
// ==============================

function openExerciseModal(
  workoutId = null
) {

  if (!selectedMuscle) {
    return;
  }


  clearFormErrors();


  lastFocusedElement =
    document.activeElement;


  const workoutToEdit =
    workoutId

      ? workouts.find(
          (workout) =>
            workout.id === workoutId
        )

      : null;


  // MODO EDICIÓN
  if (workoutToEdit) {

    editingIdInput.value =
      workoutToEdit.id;


    exerciseNameInput.value =
      workoutToEdit.exercise;


    weightInput.value =
      workoutToEdit.weight;


    setsInput.value =
      workoutToEdit.sets;


    repsInput.value =
      workoutToEdit.reps;


    workoutDateInput.value =
      workoutToEdit.date;


    modalTitle.textContent =
      "Editar ejercicio";


    saveExerciseButton.textContent =
      "Guardar cambios";

  }

  // MODO AÑADIR
  else {

    exerciseForm.reset();


    editingIdInput.value =
      "";


    setDefaultDate();


    modalTitle.textContent =
      "Añadir ejercicio";


    saveExerciseButton.textContent =
      "Guardar ejercicio";

  }


  modalMuscleLabel.textContent =
    selectedMuscle.toUpperCase();


  exerciseModal.classList.add(
    "is-open"
  );


  exerciseModal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "modal-open"
  );


  window.setTimeout(
    () => exerciseNameInput.focus(),
    0
  );

}


// ==============================
// CERRAR FORMULARIO
// ==============================

function closeExerciseModal() {

  exerciseModal.classList.remove(
    "is-open"
  );


  exerciseModal.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.classList.remove(
    "modal-open"
  );


  clearFormErrors();


  if (
    lastFocusedElement &&
    typeof lastFocusedElement.focus ===
      "function"
  ) {

    lastFocusedElement.focus();

  }

}


// ==============================
// GUARDAR FORMULARIO
// ==============================

function handleFormSubmit(event) {

  event.preventDefault();


  const formData =
    getValidatedFormData();


  if (!formData) {
    return;
  }


  const editingId =
    editingIdInput.value;


  // EDITAR
  if (editingId) {

    const workoutIndex =
      workouts.findIndex(
        (workout) =>
          workout.id === editingId
      );


    if (workoutIndex === -1) {

      showToast(
        "No se ha podido encontrar el registro que querías editar.",
        "error"
      );


      closeExerciseModal();

      return;
    }


    workouts[workoutIndex] = {

      ...workouts[workoutIndex],

      ...formData

    };


    saveWorkouts();

    closeExerciseModal();

    renderSelectedMuscleHistory();

    updateDashboardCounts();


    showToast(
      "Entrenamiento actualizado correctamente."
    );


    return;

  }


  // AÑADIR
  const newWorkout = {

    id: createUniqueId(),

    ...formData

  };


  workouts.push(
    newWorkout
  );


  saveWorkouts();

  closeExerciseModal();

  renderSelectedMuscleHistory();

  updateDashboardCounts();


  showToast(
    "Entrenamiento añadido correctamente."
  );

}


// ==============================
// VALIDACIÓN
// ==============================

function getValidatedFormData() {

  clearFormErrors();


  const exercise =
    exerciseNameInput
      .value
      .trim();


  const normalizedWeight =
    weightInput
      .value
      .replace(",", ".");


  const weight =
    Number(normalizedWeight);


  const sets =
    Number(setsInput.value);


  const reps =
    Number(repsInput.value);


  const date =
    workoutDateInput.value;


  let isValid = true;


  // Nombre
  if (!exercise) {

    setFieldError(
      exerciseNameInput,
      "exerciseNameError",
      "Escribe el nombre del ejercicio."
    );


    isValid = false;

  }


  // Peso
  if (
    !Number.isFinite(weight) ||
    weight <= 0
  ) {

    setFieldError(
      weightInput,
      "weightError",
      "Introduce un peso válido mayor que 0."
    );


    isValid = false;

  }


  // Series
  if (
    !Number.isInteger(sets) ||
    sets <= 0
  ) {

    setFieldError(
      setsInput,
      "setsError",
      "Las series deben ser un entero mayor que 0."
    );


    isValid = false;

  }


  // Repeticiones
  if (
    !Number.isInteger(reps) ||
    reps <= 0
  ) {

    setFieldError(
      repsInput,
      "repsError",
      "Las repeticiones deben ser un entero mayor que 0."
    );


    isValid = false;

  }


  // Fecha
  if (!isValidIsoDate(date)) {

    setFieldError(
      workoutDateInput,
      "workoutDateError",
      "Selecciona una fecha válida."
    );


    isValid = false;

  }


  if (!isValid) {
    return null;
  }


  return {

    muscleGroup:
      selectedMuscle,

    exercise:
      exercise,

    weight:
      roundToOneDecimal(weight),

    sets:
      sets,

    reps:
      reps,

    date:
      date

  };

}


// ==============================
// EDITAR Y ELIMINAR
// ==============================

function handleHistoryActions(event) {

  const actionButton =
    event.target.closest(
      "button[data-action]"
    );


  if (!actionButton) {
    return;
  }


  const workoutId =
    actionButton.dataset.id;


  const action =
    actionButton.dataset.action;


  const workout =
    workouts.find(
      (item) =>
        item.id === workoutId
    );


  if (!workout) {
    return;
  }


  // EDITAR
  if (action === "edit") {

    openExerciseModal(
      workoutId
    );


    return;
  }


  // ELIMINAR
  if (action === "delete") {

    const confirmed =
      window.confirm(

        `¿Seguro que quieres eliminar ${workout.exercise} del ${formatDate(workout.date)}?`

      );


    if (!confirmed) {
      return;
    }


    workouts =
      workouts.filter(
        (item) =>
          item.id !== workoutId
      );


    saveWorkouts();

    renderSelectedMuscleHistory();

    updateDashboardCounts();


    showToast(
      "Entrenamiento eliminado."
    );

  }

}


// ==============================
// CONTADORES
// ==============================

function updateDashboardCounts() {

  totalWorkouts.textContent =
    workouts.length;


  MUSCLE_GROUPS.forEach(
    (muscle) => {

      const count =
        workouts.filter(
          (workout) =>
            workout.muscleGroup ===
            muscle
        ).length;


      const countElement =
        document.querySelector(
          `[data-count-for="${muscle}"]`
        );


      if (countElement) {

        countElement.textContent =
          count;

      }

    }
  );

}


// ==============================
// LOCAL STORAGE
// ==============================

function loadWorkouts() {

  try {

    const storedData =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (!storedData) {
      return [];
    }


    const parsedData =
      JSON.parse(storedData);


    if (!Array.isArray(parsedData)) {
      return [];
    }


    return parsedData.filter(
      isValidStoredWorkout
    );

  }

  catch (error) {

    console.error(
      "No se pudieron cargar los entrenamientos guardados:",
      error
    );


    return [];

  }

}


function saveWorkouts() {

  try {

    localStorage.setItem(

      STORAGE_KEY,

      JSON.stringify(
        workouts
      )

    );

  }

  catch (error) {

    console.error(
      "No se pudieron guardar los entrenamientos:",
      error
    );


    showToast(
      "El navegador no ha podido guardar los datos.",
      "error"
    );

  }

}


// ==============================
// VALIDAR DATOS GUARDADOS
// ==============================

function isValidStoredWorkout(
  workout
) {

  return Boolean(

    workout &&

    typeof workout.id ===
      "string" &&


    MUSCLE_GROUPS.includes(
      workout.muscleGroup
    ) &&


    typeof workout.exercise ===
      "string" &&


    workout.exercise.trim() &&


    Number.isFinite(
      Number(workout.weight)
    ) &&


    Number(workout.weight) > 0 &&


    Number.isInteger(
      Number(workout.sets)
    ) &&


    Number(workout.sets) > 0 &&


    Number.isInteger(
      Number(workout.reps)
    ) &&


    Number(workout.reps) > 0 &&


    isValidIsoDate(
      workout.date
    )

  );

}


// ==============================
// FECHA ACTUAL
// ==============================

function setDefaultDate() {

  workoutDateInput.value =
    getLocalIsoDate();

}


function getLocalIsoDate() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      now.getDate()
    ).padStart(2, "0");


  return `${year}-${month}-${day}`;

}


// ==============================
// VALIDAR FECHA
// ==============================

function isValidIsoDate(value) {

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {

    return false;

  }


  const [
    year,
    month,
    day
  ] = value

    .split("-")

    .map(Number);


  const date =
    new Date(
      year,
      month - 1,
      day
    );


  return (

    date.getFullYear() ===
      year &&


    date.getMonth() ===
      month - 1 &&


    date.getDate() ===
      day

  );

}


// ==============================
// MOSTRAR FECHA
// ==============================

function formatDate(isoDate) {

  const [
    year,
    month,
    day
  ] = isoDate

    .split("-")

    .map(Number);


  const date =
    new Date(
      year,
      month - 1,
      day
    );


  return new Intl.DateTimeFormat(
    "es-ES",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  ).format(date);

}


// ==============================
// ORDENAR ENTRENAMIENTOS
// ==============================

function compareWorkoutDatesDesc(
  a,
  b
) {

  const dateDifference =
    b.date.localeCompare(
      a.date
    );


  if (dateDifference !== 0) {

    return dateDifference;

  }


  return String(b.id)
    .localeCompare(
      String(a.id)
    );

}


// ==============================
// NORMALIZAR NOMBRE
// ==============================

function normalizeExerciseName(
  name
) {

  return name

    .trim()

    .toLocaleLowerCase(
      "es-ES"
    )

    .replace(
      /\s+/g,
      " "
    );

}


// ==============================
// FORMATEAR NÚMEROS
// ==============================

function formatNumber(value) {

  return new Intl.NumberFormat(
    "es-ES",
    {
      maximumFractionDigits: 1
    }
  ).format(value);

}


// ==============================
// TEXTO DE REGISTROS
// ==============================

function formatRecordCount(count) {

  return `${count} ${
    count === 1
      ? "registro"
      : "registros"
  }`;

}


// ==============================
// REDONDEAR PESO
// ==============================

function roundToOneDecimal(value) {

  return Math.round(

    (
      value +
      Number.EPSILON
    ) * 10

  ) / 10;

}


// ==============================
// CREAR ID
// ==============================

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


// ==============================
// ERRORES DEL FORMULARIO
// ==============================

function setFieldError(
  inputElement,
  errorElementId,
  message
) {

  inputElement.classList.add(
    "invalid"
  );


  document.getElementById(
    errorElementId
  ).textContent = message;

}


function clearFormErrors() {

  [
    exerciseNameInput,
    weightInput,
    setsInput,
    repsInput,
    workoutDateInput
  ].forEach(
    (input) => {

      input.classList.remove(
        "invalid"
      );

    }
  );


  document
    .querySelectorAll(
      ".field-error"
    )

    .forEach(
      (errorElement) => {

        errorElement.textContent =
          "";

      }
    );

}


// ==============================
// MENSAJES
// ==============================

function showToast(
  message,
  type = "success"
) {

  window.clearTimeout(
    toastTimer
  );


  toast.textContent =
    message;


  toast.classList.toggle(
    "error",
    type === "error"
  );


  toast.classList.add(
    "show"
  );


  toastTimer =
    window.setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2600
    );

}


// ==============================
// EVITAR HTML INTRODUCIDO
// POR EL USUARIO
// ==============================

function escapeHtml(value) {

  const element =
    document.createElement(
      "div"
    );


  element.textContent =
    value;


  return element.innerHTML;

}