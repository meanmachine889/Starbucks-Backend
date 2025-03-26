import express from "express"
import dotenv from "dotenv"
import {connectDB} from "../lib/connect.js"
import cookieParser from "cookie-parser"
import cors from "cors"

dotenv.config()

const app = express()
const PORT = process.env.PORT
const MONGO_URI = process.env.MONGO_URI

app.use(express.json());
app.use(cookieParser())

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}
))

app.get("/", (req, res)=>{
    console.log(req.body)
    return res.status(200).json({status: "successfull", message: "Welcome to the home page"})
})

app.listen(PORT, ()=>{
    console.log("server is listening on port", PORT)
    connectDB(MONGO_URI)
})