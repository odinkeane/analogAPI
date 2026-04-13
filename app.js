import express from "express"
import router from "./src/router.js"
import { PORT } from "./config.js"
import cors from "cors"

const app = express()


app.use(cors())
app.use(express.json())
app.use(express.static("./public"))
app.use(router)


app.listen(PORT, () => {
    console.log(`http://127.0.0.1:${PORT}`)

})