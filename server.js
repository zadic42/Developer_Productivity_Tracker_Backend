const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes.js')
const taskRoutes = require('./src/routes/taskRoutes.js')
const timeRoutes = require('./src/routes/timeRoutes.js')
const githubRoutes = require('./src/routes/githubRoutes.js')
const skillRoutes = require('./src/routes/skillRoutes.js')

const app = express();


app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/time', timeRoutes)
app.use('/api/github', githubRoutes)
app.use('/api/skills', skillRoutes)


app.get('/', (req, res) => {
    res.send("App is running");
})



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});