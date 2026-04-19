import sqlite3 from "sqlite3"


const db = new sqlite3.Database('Film.db');
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      film_id INTEGER NOT NULL, 
      FOREIGN KEY (user_id) REFERENCES users (id)
      FOREIGN KEY (film_id) REFERENCES Film (id)
    )
  `

db.run(createTableQuery)