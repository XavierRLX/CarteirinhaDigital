// src/app.js
const express = require('express');
const userRoutes = require('./routes/users');

const app = express();

app.use(express.static('public'));
app.use(express.json());

app.use('/api/users', userRoutes);

module.exports = app;
