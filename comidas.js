"use strict";


// ==============================
// ELEMENTOS DEL HTML
// ==============================

const calendarGrid =
    document.getElementById(
        "calendarGrid"
    );


const calendarTitle =
    document.getElementById(
        "calendarTitle"
    );


const previousMonthButton =
    document.getElementById(
        "previousMonth"
    );


const nextMonthButton =
    document.getElementById(
        "nextMonth"
    );



// ==============================
// ESTADO DEL CALENDARIO
// ==============================

const today =
    new Date();


let visibleYear =
    today.getFullYear();


let visibleMonth =
    today.getMonth();


let datesWithPhotos =
    new Set();



// ==============================
// INICIAR
// ==============================

initializeFoodCalendar();



async function initializeFoodCalendar() {


    try {


        const photos =
            await getAllMealPhotos();



        datesWithPhotos =
            new Set(

                photos.map(
                    (photo) =>
                        photo.date
                )

            );


    }

    catch (error) {


        console.error(
            "No se pudieron cargar las fotos:",
            error
        );


    }



    renderCalendar();



    previousMonthButton.addEventListener(

        "click",

        () => changeMonth(-1)

    );



    nextMonthButton.addEventListener(

        "click",

        () => changeMonth(1)

    );

}



// ==============================
// CAMBIAR MES
// ==============================

function changeMonth(
    amount
) {


    visibleMonth +=
        amount;



    // Pasar de enero a diciembre.
    if (
        visibleMonth < 0
    ) {


        visibleMonth =
            11;


        visibleYear -=
            1;

    }



    // Pasar de diciembre a enero.
    if (
        visibleMonth > 11
    ) {


        visibleMonth =
            0;


        visibleYear +=
            1;

    }



    renderCalendar();

}



// ==============================
// MOSTRAR CALENDARIO
// ==============================

function renderCalendar() {


    // Nombre del mes.
    calendarTitle.textContent =
        new Intl.DateTimeFormat(
            "es-ES",
            {
                month: "long",
                year: "numeric"
            }
        ).format(

            new Date(
                visibleYear,
                visibleMonth,
                1
            )

        );



    // Primera letra mayúscula.
    calendarTitle.textContent =

        calendarTitle.textContent
            .charAt(0)
            .toUpperCase()

        +

        calendarTitle.textContent
            .slice(1);



    const firstDay =
        new Date(
            visibleYear,
            visibleMonth,
            1
        );



    const lastDay =
        new Date(
            visibleYear,
            visibleMonth + 1,
            0
        );



    /*
        JavaScript:

        Domingo = 0
        Lunes = 1

        Nosotros queremos:

        Lunes = 0
        Domingo = 6
    */

    const startingOffset =
        (
            firstDay.getDay() + 6
        ) % 7;



    const totalDays =
        lastDay.getDate();



    const cells =
        [];



    // Espacios vacíos anteriores
    // al día 1.
    for (
        let i = 0;
        i < startingOffset;
        i += 1
    ) {


        cells.push(
            `
            <div
                class="calendar-day calendar-day-empty"
            ></div>
            `
        );


    }



    // Creamos cada día.
    for (
        let day = 1;
        day <= totalDays;
        day += 1
    ) {


        const isoDate =
            toIsoDate(
                visibleYear,
                visibleMonth,
                day
            );



        const todayIso =
            toIsoDate(
                today.getFullYear(),
                today.getMonth(),
                today.getDate()
            );



        const isToday =
            isoDate === todayIso;



        const hasPhotos =
            datesWithPhotos.has(
                isoDate
            );



        cells.push(
            `

            <button

                class="
                    calendar-day
                    ${isToday ? "is-today" : ""}
                    ${hasPhotos ? "has-photos" : ""}
                "

                type="button"

                data-date="${isoDate}"

            >


                <span class="calendar-day-number">

                    ${day}

                </span>


                ${
                    hasPhotos

                        ? `
                            <span class="calendar-photo-indicator">
                                ●
                            </span>
                          `

                        : ""
                }


            </button>

            `
        );


    }



    calendarGrid.innerHTML =
        cells.join("");



    // Añadimos el click a cada día.
    calendarGrid
        .querySelectorAll(
            "[data-date]"
        )
        .forEach(
            (button) => {


                button.addEventListener(
                    "click",
                    () => {


                        const date =
                            button.dataset.date;



                        window.location.href =
                            `dia-comidas.html?date=${date}`;


                    }
                );


            }
        );

}



// ==============================
// CREAR FECHA YYYY-MM-DD
// ==============================

function toIsoDate(
    year,
    monthIndex,
    day
) {


    const month =
        String(
            monthIndex + 1
        ).padStart(
            2,
            "0"
        );


    const formattedDay =
        String(
            day
        ).padStart(
            2,
            "0"
        );



    return `${year}-${month}-${formattedDay}`;

}