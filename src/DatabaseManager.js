import sqlite3 from "sqlite3"
import { DATABASE_NAME } from "../config.js"




export class Films {
    static getAllFilms() {
        const database = new sqlite3.Database(DATABASE_NAME)
        return new Promise((resolve, reject) => {
            database.all(
                `SELECT 
                    f.*,
                    CONCAT('/images/posters/', p.poster_URL) as poster_URL,
                    d.desc
                FROM Film as f
                INNER JOIN  posters as p ON f.id = p.film_id
                INNER JOIN  Description as d ON f.id = d.id_film;`,
                (err, result) => {
                    database.close()
                    if (err) reject(err)
                    else resolve(result)
                }
            )
        })
    }


    static getTop25() {
        const database = new sqlite3.Database(DATABASE_NAME)
        return new Promise((resolve, reject) => {
            database.all(
                `SELECT 
                    f.*,
                    CONCAT('/images/posters/', p.poster_URL) as poster_URL,
                    d.desc
                FROM Film as f
                INNER JOIN  posters as p ON f.id = p.film_id
                INNER JOIN  Description as d ON f.id = d.id_film
                ORDER BY rating DESC
                LIMIT 25;`,
                (err, result) => {
                    database.close()
                    if (err) reject(err)
                    else resolve(result)
                }
            )
        })
    }

    static getFilmById(id) {
        const database = new sqlite3.Database(DATABASE_NAME)
        return new Promise((resolve, reject) => {
            database.all(
                `SELECT 
                    f.*,
                    CONCAT('/images/posters/', p.poster_URL) as poster_URL,
                    d.desc
                FROM Film as f
                INNER JOIN  posters as p ON f.id = p.film_id
                INNER JOIN  Description as d ON f.id = d.id_film
                WHERE f.id = ?
                ORDER BY rating DESC
                LIMIT 25;`,
                [id]
                ,
                (err, result) => {
                    database.close()
                    if (err) reject(err)
                    else resolve(result)
                }
            )
        })
    }


    static getGenresForFilm(id) {
        const database = new sqlite3.Database(DATABASE_NAME)
        return new Promise((resolve, reject) => {
            database.all(
                `SELECT gn.name
                FROM Film as f
                INNER JOIN genresfilm as g ON f.id = g.film_id
                INNER JOIN genre as gn ON gn.id = g.genre_id
                WHERE f.id = ?;`,
                [id]
                ,
                (err, result) => {
                    database.close()
                    if (err) reject(err)
                    else resolve(result)
                }
            )
        })
    }

    static getFilmByActor(actor_id) {
        const database = new sqlite3.Database(DATABASE_NAME)
        return new Promise((resolve, reject) => {
            database.all(
                `SELECT f.title
                FROM Film as f
                INNER JOIN Cast as c ON f.id = c.id_film
                WHERE c.id_actor = ?;`,
                [actor_id]
                ,
                (err, result) => {
                    database.close()
                    if (err) reject(err)
                    else resolve(result)
                }
            )
        })
    }


}




export class Actors {
    static getActorsByFilm(film_id) {
        const database = new sqlite3.Database(DATABASE_NAME)
        return new Promise((resolve, reject) => {
            database.all(
                `SELECT a.id, a.surname, a.name
                FROM Actors as a
                INNER JOIN Cast as c ON a.id = c.id_actor
                WHERE c.id_film = ?;`,
                [film_id]
                ,
                (err, result) => {
                    database.close()
                    if (err) reject(err)
                    else resolve(result)
                }
            )
        })
    }


    static getAllActors() {
        const database = new sqlite3.Database(DATABASE_NAME)
        return new Promise((resolve, reject) => {
            database.all(
                `SELECT a.id, a.surname, a.name 
                    CONCAT('/images/actors/', a.image) as image_URL
                FROM Actors as a`,
                (err, result) => {
                    database.close()
                    if (err) reject(err)
                    else resolve(result)
                }
            )
        })
    }

    static getActorById(actor_id) {
        const database = new sqlite3.Database(DATABASE_NAME)
        return new Promise((resolve, reject) => {
            database.all(
                `SELECT a.surname, a.name, a.age, a.Biography, 
                    CONCAT('/images/actors/', a.image) as image_URL
                FROM Actors as a
                WHERE a.id = ?
                `,
                [actor_id],
                (err, result) => {
                    database.close()
                    if (err) reject(err)
                    else resolve(result)
                }
            )
        })
    }







}