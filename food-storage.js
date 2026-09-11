"use strict";


// ==============================
// CONFIGURACIÓN DE LA BASE
// ==============================

const FOOD_DB_NAME =
    "gymTrackFoodDB";

const FOOD_DB_VERSION =
    1;

const FOOD_STORE =
    "mealPhotos";



// ==============================
// ABRIR BASE DE DATOS
// ==============================

function openFoodDatabase() {

    return new Promise(
        (resolve, reject) => {


            const request =
                indexedDB.open(
                    FOOD_DB_NAME,
                    FOOD_DB_VERSION
                );



            // Se ejecuta la primera vez
            // que creamos la base.
            request.onupgradeneeded =
                () => {


                    const db =
                        request.result;



                    if (
                        !db.objectStoreNames.contains(
                            FOOD_STORE
                        )
                    ) {


                        const store =
                            db.createObjectStore(
                                FOOD_STORE,
                                {
                                    keyPath: "id"
                                }
                            );



                        // Índice por fecha.
                        store.createIndex(
                            "date",
                            "date",
                            {
                                unique: false
                            }
                        );



                        // Índice por fecha + comida.
                        store.createIndex(
                            "dateMeal",
                            [
                                "date",
                                "meal"
                            ],
                            {
                                unique: false
                            }
                        );

                    }

                };



            request.onsuccess =
                () => {

                    resolve(
                        request.result
                    );

                };



            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };


        }
    );

}



// ==============================
// OBTENER TODAS LAS FOTOS
// ==============================

async function getAllMealPhotos() {

    const db =
        await openFoodDatabase();


    return new Promise(
        (resolve, reject) => {


            const transaction =
                db.transaction(
                    FOOD_STORE,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    FOOD_STORE
                );


            const request =
                store.getAll();



            request.onsuccess =
                () => {

                    resolve(
                        request.result || []
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };


            transaction.oncomplete =
                () => {

                    db.close();

                };


        }
    );

}



// ==============================
// OBTENER FOTOS DE UN DÍA
// ==============================

async function getMealPhotosByDate(
    date
) {

    const db =
        await openFoodDatabase();


    return new Promise(
        (resolve, reject) => {


            const transaction =
                db.transaction(
                    FOOD_STORE,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    FOOD_STORE
                );


            const index =
                store.index(
                    "date"
                );


            const request =
                index.getAll(
                    date
                );



            request.onsuccess =
                () => {

                    resolve(
                        request.result || []
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };


            transaction.oncomplete =
                () => {

                    db.close();

                };


        }
    );

}



// ==============================
// GUARDAR FOTO
// ==============================

async function addMealPhoto(
    record
) {

    const db =
        await openFoodDatabase();


    return new Promise(
        (resolve, reject) => {


            const transaction =
                db.transaction(
                    FOOD_STORE,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    FOOD_STORE
                );


            store.add(
                record
            );



            transaction.oncomplete =
                () => {

                    db.close();

                    resolve();

                };



            transaction.onerror =
                () => {

                    db.close();

                    reject(
                        transaction.error
                    );

                };


        }
    );

}



// ==============================
// ELIMINAR FOTO
// ==============================

async function deleteMealPhoto(
    id
) {

    const db =
        await openFoodDatabase();


    return new Promise(
        (resolve, reject) => {


            const transaction =
                db.transaction(
                    FOOD_STORE,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    FOOD_STORE
                );


            store.delete(
                id
            );



            transaction.oncomplete =
                () => {

                    db.close();

                    resolve();

                };



            transaction.onerror =
                () => {

                    db.close();

                    reject(
                        transaction.error
                    );

                };


        }
    );

}



// ==============================
// CREAR ID ÚNICO
// ==============================

function createFoodRecordId() {


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
// REDUCIR TAMAÑO DE IMAGEN
// ==============================

async function compressFoodImage(
    file,
    maxSize = 1280,
    quality = 0.82
) {


    // Comprobamos que realmente
    // sea una imagen.
    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        throw new Error(
            "El archivo seleccionado no es una imagen."
        );

    }



    const imageBitmap =
        await createImageBitmap(
            file
        );



    let width =
        imageBitmap.width;

    let height =
        imageBitmap.height;



    // Si la imagen es demasiado grande,
    // reducimos su resolución.
    if (
        width > maxSize ||
        height > maxSize
    ) {


        const scale =
            Math.min(
                maxSize / width,
                maxSize / height
            );


        width =
            Math.round(
                width * scale
            );


        height =
            Math.round(
                height * scale
            );

    }



    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        width;


    canvas.height =
        height;



    const context =
        canvas.getContext(
            "2d"
        );



    context.drawImage(
        imageBitmap,
        0,
        0,
        width,
        height
    );



    imageBitmap.close();



    return new Promise(
        (resolve, reject) => {


            canvas.toBlob(

                (blob) => {


                    if (blob) {

                        resolve(
                            blob
                        );

                    }

                    else {

                        reject(
                            new Error(
                                "No se ha podido procesar la imagen."
                            )
                        );

                    }

                },


                "image/jpeg",


                quality

            );


        }
    );

}