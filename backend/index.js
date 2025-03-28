import express from "express"
import dotenv from "dotenv"
import {connectDB} from "./lib/connect.js"
import cors from "cors"
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";


dotenv.config()

const app = express()
const PORT = process.env.PORT
const MONGO_URI = process.env.MONGO_URI

app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}
))

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.get("/", (req, res)=>{
    console.log(req.body)
    return res.status(200).json({status: "successfull", message: "Welcome to the home page"})
})

app.listen(PORT, ()=>{
    console.log("server is listening on port", PORT)
    connectDB(MONGO_URI)
})