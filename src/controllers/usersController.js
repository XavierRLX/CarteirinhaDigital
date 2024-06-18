// src/controllers/usersController.js
const supabaseService = require('../services/supabaseService');

exports.registerUser = async (req, res) => {
  try {
    const { email, password, nome, curso, validade, cpf, dataNascimento, numeroTel, fotoUrl } = req.body;
    const response = await supabaseService.registerUser({ email, password, nome, curso, validade, cpf, dataNascimento, numeroTel, fotoUrl });
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
