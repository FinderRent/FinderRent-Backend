//backend server
const express = require('express');

const studentRouter = require('./routes/studentsRoutes');
const landlordRouter = require('./routes/landlordsRoutes');

const app = express();

app.use(express.json());

//middleware
app.use('/api/v1/students', studentRouter);
app.use('/api/v1/landlord', landlordRouter);


module.exports = app;