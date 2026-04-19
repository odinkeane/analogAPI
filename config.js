import "dotenv/config"


const PORT = process.env.PORT
const DATABASE_NAME = process.env.DATABASE_NAME
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
export { PORT, DATABASE_NAME, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET }