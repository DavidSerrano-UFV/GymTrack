import OpenAI from "openai";


// ==============================
// CONFIGURACIÓN OPENAI
// ==============================

const openai =
    new OpenAI({
        apiKey:
            process.env.OPENAI_API_KEY
    });



// ==============================
// ORÍGENES PERMITIDOS
// ==============================

const allowedOrigins = [

    // Tu web publicada en GitHub Pages
    "https://davidserrano-ufv.github.io",

    // Desarrollo local con Live Server
    "http://127.0.0.1:5500",
    "http://localhost:5500",

    // Por si trabajas en el puerto 3000
    "http://127.0.0.1:3000",
    "http://localhost:3000"

];



// ==============================
// FUNCIÓN PRINCIPAL
// ==============================

export default async function handler(
    request,
    response
) {


    // ==============================
    // CORS
    // ==============================

    const origin =
        request.headers.origin;


    if (
        origin &&
        allowedOrigins.includes(origin)
    ) {

        response.setHeader(

            "Access-Control-Allow-Origin",

            origin

        );

    }


    response.setHeader(

        "Access-Control-Allow-Methods",

        "POST, OPTIONS"

    );


    response.setHeader(

        "Access-Control-Allow-Headers",

        "Content-Type"

    );



    // ==============================
    // PETICIÓN OPTIONS
    // ==============================

    if (
        request.method === "OPTIONS"
    ) {

        return response
            .status(204)
            .end();

    }



    // ==============================
    // SOLO PERMITIMOS POST
    // ==============================

    if (
        request.method !== "POST"
    ) {

        return response
            .status(405)
            .json({

                error:
                    "Método no permitido."

            });

    }



    // ==============================
    // COMPROBAR API KEY
    // ==============================

    if (
        !process.env.OPENAI_API_KEY
    ) {

        console.error(
            "Falta OPENAI_API_KEY."
        );


        return response
            .status(500)
            .json({

                error:
                    "La API no está configurada correctamente."

            });

    }



    try {


        // ==============================
        // DATOS RECIBIDOS
        // ==============================

        const {
            message,
            goal
        } =
            request.body || {};



        // ==============================
        // VALIDAR MENSAJE
        // ==============================

        if (
            typeof message !== "string" ||
            !message.trim()
        ) {

            return response
                .status(400)
                .json({

                    error:
                        "El mensaje está vacío."

                });

        }



        if (
            message.length > 2000
        ) {

            return response
                .status(400)
                .json({

                    error:
                        "El mensaje es demasiado largo."

                });

        }



        // ==============================
        // OBJETIVO DEL USUARIO
        // ==============================

        const validGoals = [

            "Ganar masa muscular",
            "Perder grasa",
            "Mantener peso"

        ];



        const userGoal =
            validGoals.includes(goal)

                ? goal

                : "No especificado";



        // ==============================
        // LLAMAR A OPENAI
        // ==============================

        const aiResponse =
            await openai.responses.create({

                model:
                    "gpt-5.6-luna",


                instructions: `
Eres GymTrack Nutrition, un asistente de alimentación
integrado en una aplicación de gimnasio.

Tu función principal es proponer ideas de comidas y recetas
adaptadas al objetivo del usuario.

Cuando el usuario pida una receta:

- Propón una receta concreta.
- Indica los ingredientes.
- Indica cantidades aproximadas.
- Explica brevemente cómo prepararla.
- Indica las calorías aproximadas.
- Indica las proteínas aproximadas.
- Si es útil, indica también carbohidratos y grasas.
- Adapta las cantidades y la receta al objetivo del usuario.
- Responde siempre en español.
- Utiliza un lenguaje claro y práctico.

No presentes las estimaciones nutricionales como valores exactos.
No sustituyas el consejo de un profesional sanitario.
                `,


                input:
                    `
OBJETIVO DEL USUARIO:
${userGoal}

MENSAJE DEL USUARIO:
${message.trim()}
                    `

            });



        // ==============================
        // RESPUESTA
        // ==============================

        return response
            .status(200)
            .json({

                reply:
                    aiResponse.output_text

            });


    }

    catch (error) {


        console.error(
            "Error al llamar a OpenAI:",
            error
        );


        return response
            .status(500)
            .json({

                error:
                    "No se ha podido generar la respuesta."

            });

    }

}