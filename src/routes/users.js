// src/routes/users.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.post('/', usersController.registerUser);

module.exports = router;
