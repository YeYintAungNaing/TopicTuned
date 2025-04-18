import express from "express"
import cors from "cors"
import axios from 'axios'
import 'dotenv/config';

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

const app = express()
app.use(express.json())

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
    allowedHeaders: ["Authorization", "Content-Type"],
}))


app.get('/GNews', async (req, res) => {
    try{
        const response : any = await axios.get(`https://gnews.io/api/v4/top-headlines?category=technology&lang=en&country=us&max=3&apikey=${GNEWS_API_KEY}`)
        //console.log(response.data.articles)
        res.status(200).json(response.data.articles)
        
    }
    catch(e) {
        res.status(500).json({message : "Server error"})
        console.log(e)
    }
})


app.listen(8800, ()=> {
    console.log('connected to port 8800')
})