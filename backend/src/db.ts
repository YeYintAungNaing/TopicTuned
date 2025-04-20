import { Pool } from "pg"
import 'dotenv/config';

const USER = process.env.USER;
const PASSWORD = process.env.PASSWORD;
const HOST = process.env.HOST;
const DATABASE = process.env.DATABASE;
const PORT = process.env.PORT;


const pool = new Pool({
    user: USER,
    password: PASSWORD,
    host: HOST,
    port: Number(PORT),
    database: DATABASE,
})

console.log('connect to db')

export default pool


// user table (postgresql)
// CREATE TABLE users (
//     user_id SERIAL PRIMARY KEY,
//     user_name TEXT NOT NULL,
//     password TEXT NOT NULL,
//     email TEXT,
//     display_name TEXT,
//     created_at TIMESTAMP WITH TIME ZONE,
//     profile_img_url TEXT
//   );
   