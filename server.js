const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes.js')
const taskRoutes = require('./src/routes/taskRoutes.js')
const timeRoutes = require('./src/routes/timeRoutes.js')
const githubRoutes = require('./src/routes/githubRoutes.js')
const skillRoutes = require('./src/routes/skillRoutes.js')
const goalRoutes = require('./src/routes/goalRoutes.js')
const reportRoutes = require('./src/routes/reportRoutes.js')
const gamificationRoutes = require('./src/routes/gamificationRoutes.js')
const notificationRoutes = require('./src/routes/notificationRoutes.js')
const teamRoutes = require('./src/routes/teamRoutes.js')
const analyticsRoutes = require('./src/routes/analyticsRoutes.js')
const userRoutes = require('./src/routes/userRoutes.js')

const app = express();


app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/time', timeRoutes)
app.use('/api/github', githubRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/goals', goalRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/gamification', gamificationRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/user', userRoutes)


app.get('/', (req, res) => {
    res.send("App is running");
})



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});