const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const router = express.Router();

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

router.post('/useCarterinha', async (req, res, next) => {
  try {
    const { toEmail, nome, data, hora } = req.body;

    const emailTemplatePath = path.join(__dirname, 'modelUse.html');
    const EmailUse = fs.readFileSync(emailTemplatePath, 'utf-8');
    const personalizeEmail = EmailUse.replace('{{nome}}', nome).replace('{{data}}', data).replace('{{hora}}', hora);

    await sendEmail(toEmail, 'Carterinha Digital - Acesso', personalizeEmail);

    res.send('Enviado');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
