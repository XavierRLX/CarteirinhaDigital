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
  try {
    const mailOptions = {
      from: 'teste',
      to: toEmail,
      subject: subject,
      html: htmlContent,
    };

    await transport.sendMail(mailOptions);
  } catch (err) {
    throw err;
  }
};

router.post('/useCarteirinha', async (req, res, next) => {
  try {
    const { toEmail, nome, dia, hora, street, neighborhood, city, state, country, houseNumber, latitude, longitude } = req.body;

    let EmailUse = fs.readFileSync(__dirname + '/ModelsEmails/modelUse.html', 'utf-8');
    EmailUse = EmailUse.replace('{{nome}}', nome)
                        .replace('{{dia}}', dia)
                        .replace('{{hora}}', hora)
                        .replace('{{street}}', street)
                        .replace('{{neighborhood}}', neighborhood)
                        .replace('{{city}}', city)
                        .replace('{{state}}', state)
                        .replace('{{country}}', country)
                        .replace('{{houseNumber}}', houseNumber)
                        .replace('{{latitude}}', latitude)
                        .replace('{{longitude}}', longitude);

    await sendEmail(toEmail, 'Carteirinha Digital - Acesso', EmailUse);

    console.log('Dados Enviados', { toEmail, nome, dia, hora, street, neighborhood, city, state, country, houseNumber, latitude, longitude });
    res.send('Enviado.');
  } catch (err) {
    console.error('Erro ao enviar email:', err);
    next(err);
  }
  console.log('Dados recebidos:', { toEmail, nome, dia, hora, street, neighborhood, city, state, country, houseNumber, latitude, longitude });
});

module.exports = router;
