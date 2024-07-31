const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const router = express.Router();
const axios = require('axios');

router.use(bodyParser.urlencoded({ extended: false }));

// Configuração do transporte
const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'renanlima2000.aer@gmail.com',
    pass: 'bnaeauszgluontqb',
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Função para enviar emails
const sendEmail = async (toEmail, subject, htmlContent) => {
  const mailOptions = {
    from: 'Carteirinha Digital <no-reply@carteirinha.com>',
    to: toEmail,
    subject: subject,
    html: htmlContent,
  };

  try {
    await transport.sendMail(mailOptions);
  } catch (err) {
    console.error('Erro ao enviar email:', err);
    throw err;
  }
};

router.post('/useCarteirinha', async (req, res, next) => {
  const { toEmail, nome, dia, hora, street, neighborhood, city, state, country, houseNumber, latitude, longitude } = req.body;

  try {
    let EmailUse = fs.readFileSync(path.join(__dirname, 'ModelsEmails', 'modelUse.html'), 'utf-8');
    const replacements = { nome, dia, hora, street, neighborhood, city, state, country, houseNumber, latitude, longitude };

    for (const [key, value] of Object.entries(replacements)) {
      EmailUse = EmailUse.replace(`{{${key}}}`, value);
    }

    await sendEmail(toEmail, 'Carteirinha Digital - Acesso', EmailUse);

    console.log('Dados Enviados', { toEmail, nome, dia, hora, street, neighborhood, city, state, country, houseNumber, latitude, longitude });
    res.send('Enviado.');
  } catch (err) {
    console.error('Erro ao enviar email:', err);
    next(err);
  }
});

module.exports = router;
