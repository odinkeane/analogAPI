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




export class Token {
    static deleteTokenByUserId(userId) {
        const database = new sqlite3.Database(DATABASE_NAME)
        database.run('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
        database.close()
    }

    static deleteToken(token) {
        const database = new sqlite3.Database(DATABASE_NAME)
        database.run('DELETE FROM refresh_tokens WHERE token = ?', [token]);
        database.close()
    }


    static saveToken(userId, refreshToken, expiresAt) {
        const database = new sqlite3.Database(DATABASE_NAME)
        database.run(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, refreshToken, expiresAt.toISOString()]
        );
        database.close()
    }


    static getToken(token) {
        const database = new sqlite3.Database(DATABASE_NAME)
        return new Promise((resolve, reject) => {
            database.all(
                `SELECT user_id, expires_at FROM refresh_tokens WHERE token = ?
                `,
                [token],
                (err, result) => {
                    database.close()
                    if (err) reject(err)
                    else resolve(result)
                }
            )
        })
    }
}






export class User {
    static getUserByEmail(email) {
        const database = new sqlite3.Database(DATABASE_NAME)
        return new Promise((resolve, reject) => {
            database.all(
                'SELECT * FROM users WHERE email = ?',
                [email],
                (err, result) => {
                    database.close()
                    if (err) reject(err)
                    else resolve(result)
                }
            )
        })
    }

    static create(email, hashedPassword, name) {
        const database = new sqlite3.Database(DATABASE_NAME)
        return new Promise((resolve, reject) => {
            database.run(
                'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
                [email, hashedPassword, name],
                (err, result) => {
                    database.close()
                    if (err) reject(err)
                    else resolve(result)
                }
            )
        })
    }

}


export class Favorite {
    static getFavoritesById(userId) {
        const database = new sqlite3.Database(DATABASE_NAME)
        return new Promise((resolve, reject) => {
            database.all(
                `SELECT f.*
                FROM Film as f
                INNER JOIN favorites as fav ON fav.film_id = f.id
                WHERE fav.user_id = ?;`,
                [userId],
                (err, result) => {
                    database.close()
                    if (err) reject(err)
                    else resolve(result)
                }
            )
        })
    }


    static saveFavoriteFilm(userId, filmId) {
        const database = new sqlite3.Database(DATABASE_NAME)
        database.run("INSERT INTO favorites (user_id, film_id) VALUES (?, ?)", [userId, filmId])
        database.close()
    }

    static deleteFavoriteFilm(userId, filmId) {
        const database = new sqlite3.Database(DATABASE_NAME)
        database.run("DELETE FROM favorites WHERE userId = ? AND filmId = ?;", [userId, filmId])
        database.close()
    }


}