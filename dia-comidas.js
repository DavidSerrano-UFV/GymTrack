"use strict";


// ==============================
// TIPOS DE COMIDA
// ==============================

const VALID_MEALS = [
    "desayuno",
    "comida",
    "merienda",
    "cena"
];



// ==============================
// OBTENER FECHA DE LA URL
// ==============================

const params =
    new URLSearchParams(
        window.location.search
    );


const selectedDate =
    getValidSelectedDate(
        params.get("date")
    );



// ==============================
// ELEMENTOS DEL HTML
// ==============================

const dayTitle =
    document.getElementById(
        "dayTitle"
    );


const daySubtitle =
    document.getElementById(
        "daySubtitle"
    );


const mealGrid =
    document.getElementById(
        "mealGrid"
    );


const foodToast =
    document.getElementById(
        "foodToast"
    );



// ==============================
// ESTADO
// ==============================

let currentPhotos =
    [];


let foodToastTimer =
    null;



// ==============================
// INICIAR
// ==============================

initializeFoodDay();



async function initializeFoodDay() {


    updateDateHeading();



    // Inputs para subir imágenes.
    mealGrid
        .querySelectorAll(
            "input[data-upload]"
        )
        .forEach(
            (input) => {


                input.addEventListener(
                    "change",
                    handlePhotoUpload
                );


            }
        );



    // Botones de eliminar.
    mealGrid.addEventListener(
        "click",
        handleMealActions
    );



    await refreshPhotos();

}



// ==============================
// VALIDAR FECHA
// ==============================

function getValidSelectedDate(
    value
) {


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            value || ""
        )
    ) {


        const [
            year,
            month,
            day
        ] =
            value
                .split("-")
                .map(Number);



        const date =
            new Date(
                year,
                month - 1,
                day
            );



        if (

            date.getFullYear() ===
                year &&

            date.getMonth() ===
                month - 1 &&

            date.getDate() ===
                day

        ) {


            return value;

        }


    }



    // Si la URL está mal,
    // usamos la fecha de hoy.
    const now =
        new Date();



    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );



    return `${year}-${month}-${day}`;

}



// ==============================
// MOSTRAR FECHA
// ==============================

function updateDateHeading() {


    const [
        year,
        month,
        day
    ] =
        selectedDate
            .split("-")
            .map(Number);



    const date =
        new Date(
            year,
            month - 1,
            day
        );



    const formatted =
        new Intl.DateTimeFormat(
            "es-ES",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ).format(
            date
        );



    dayTitle.textContent =

        formatted
            .charAt(0)
            .toUpperCase()

        +

        formatted
            .slice(1);



    daySubtitle.textContent =
        "Sube las fotos de lo que comes durante este día.";

}



// ==============================
// SUBIR FOTO
// ==============================

async function handlePhotoUpload(
    event
) {


    const input =
        event.currentTarget;


    const meal =
        input.dataset.upload;


    const file =
        input.files &&
        input.files[0];



    if (
        !file ||
        !VALID_MEALS.includes(meal)
    ) {


        return;

    }



    try {


        input.disabled =
            true;



        // Reducimos tamaño antes
        // de guardar la imagen.
        const compressedImage =
            await compressFoodImage(
                file
            );



        await addMealPhoto({

            id:
                createFoodRecordId(),

            date:
                selectedDate,

            meal:
                meal,

            image:
                compressedImage,

            /*
                Lo dejamos preparado
                para la IA.
            */
            calories:
                null,

            createdAt:
                Date.now()

        });



        await refreshPhotos();



        showFoodToast(
            "Foto guardada correctamente."
        );


    }

    catch (error) {


        console.error(
            "No se pudo guardar la foto:",
            error
        );


        showFoodToast(
            "No se ha podido guardar la foto.",
            "error"
        );


    }

    finally {


        input.value =
            "";


        input.disabled =
            false;


    }

}



// ==============================
// ELIMINAR FOTO
// ==============================

async function handleMealActions(
    event
) {


    const deleteButton =
        event.target.closest(
            "button[data-delete-photo]"
        );



    if (!deleteButton) {

        return;

    }



    const id =
        deleteButton.dataset.deletePhoto;



    try {


        await deleteMealPhoto(
            id
        );


        await refreshPhotos();



        showFoodToast(
            "Foto eliminada."
        );


    }

    catch (error) {


        console.error(
            "No se pudo eliminar la foto:",
            error
        );


        showFoodToast(
            "No se ha podido eliminar la foto.",
            "error"
        );


    }

}



// ==============================
// RECARGAR FOTOS
// ==============================

async function refreshPhotos() {


    try {


        currentPhotos =
            await getMealPhotosByDate(
                selectedDate
            );


        renderMealPhotos();


    }

    catch (error) {


        console.error(
            "No se pudieron cargar las fotos:",
            error
        );


        showFoodToast(
            "No se han podido cargar las fotos.",
            "error"
        );


    }

}



// ==============================
// MOSTRAR FOTOS
// ==============================

function renderMealPhotos() {


    VALID_MEALS.forEach(
        (meal) => {


            const list =
                document.querySelector(
                    `[data-photo-list="${meal}"]`
                );



            const mealPhotos =
                currentPhotos

                    .filter(
                        (photo) =>
                            photo.meal === meal
                    )

                    .sort(
                        (a, b) =>
                            a.createdAt -
                            b.createdAt
                    );



            // Si no hay imágenes.
            if (
                mealPhotos.length === 0
            ) {


                list.innerHTML =
                    `

                    <div class="meal-empty-photo">

                        <span>
                            Sin fotos
                        </span>

                        <small>
                            Añade una imagen de esta comida
                        </small>

                    </div>

                    `;


                return;

            }



            // Si hay imágenes.
            list.innerHTML =
                mealPhotos
                    .map(
                        (photo) => {


                            const imageUrl =
                                URL.createObjectURL(
                                    photo.image
                                );



                            return `

                                <figure class="meal-photo-item">


                                    <img
                                        src="${imageUrl}"
                                        alt="Foto de ${meal}"
                                    >


                                    <button

                                        class="meal-photo-delete"

                                        type="button"

                                        data-delete-photo="${photo.id}"

                                        aria-label="Eliminar foto"

                                    >
                                        ×
                                    </button>


                                    <figcaption>


                                        <span>
                                            Calorías
                                        </span>


                                        <strong>

                                            ${
                                                photo.calories == null

                                                    ? "Pendiente de IA"

                                                    : `${photo.calories} kcal`
                                            }

                                        </strong>


                                    </figcaption>


                                </figure>

                            `;


                        }
                    )

                    .join("");


        }
    );

}



// ==============================
// MENSAJES
// ==============================

function showFoodToast(
    message,
    type = "success"
) {


    window.clearTimeout(
        foodToastTimer
    );



    foodToast.textContent =
        message;



    foodToast.classList.toggle(
        "error",
        type === "error"
    );



    foodToast.classList.add(
        "show"
    );



    foodToastTimer =
        window.setTimeout(
            () => {


                foodToast.classList.remove(
                    "show"
                );


            },
            2600
        );

}