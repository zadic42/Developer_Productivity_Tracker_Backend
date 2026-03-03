const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes.js')

const app = express();


app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes)


app.get('/' , (req , res) => {
    res.send("App is running");
})



const PORT =  process.env.PORT || 3000;

app.listen(PORT , () => {
    console.log(`http://localhost:${PORT}`);
});