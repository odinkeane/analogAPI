import { Router } from "express"
import { Actors, Films } from "./DatabaseManager.js"
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import yaml from 'yaml';



const router = Router()
const __dirname = import.meta.dirname


const swaggerDocument = yaml.parse(readFileSync('./swagger.yaml', 'utf8'));

router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));






router.get("/films", async (req, res) => {
    const films = await Films.getAllFilms()
    return res.status(200).json(films)
})

router.get("/top25", async (req, res) => {
    const films = await Films.getTop25()
    return res.status(200).json(films)
})


router.get("/films/:id", async (req, res) => {
    const film_id = req.params["id"]
    const film = await Films.getFilmById(film_id)
    const genres = await Films.getGenresForFilm(film_id)
    const actors = await Actors.getActorsByFilm(film_id)
    film[0].genres = genres
    film[0].actors = actors
    res.status(200).json(film[0])
})


router.get("/actors", async (req, res) => {
    const actors = await Actors.getAllActors()
    return res.status(200).json(actors)
})

router.get("/actors/:id", async (req, res) => {
    const actor_id = req.params["id"]
    const actor = await Actors.getActorById(actor_id)
    const films = await Films.getFilmByActor(actor_id)
    actor[0].films = films
    return res.status(200).json(actor[0])
})




export default router