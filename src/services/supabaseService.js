// src/services/supabaseService.js
const supabase = require('../config/supabase');

exports.registerUser = async (userData) => {
  const { email, password, nome, curso, validade, cpf, dataNascimento, numeroTel, fotoUrl } = userData;

  const { data, error } = await supabase.from('users').insert([
    { email, password, nome, curso, validade, cpf, dataNascimento, numeroTel, fotoUrl }
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
