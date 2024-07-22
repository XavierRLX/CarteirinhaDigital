const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const router = express.Router();

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
    const { toEmail, nome, data, hora } = req.body;
    console.log('Dados recebidos:', { toEmail, nome, data, hora });

    const EmailUse = fs.readFileSync(__dirname + '/ModelsEmails/modelUse.html', 'utf-8');
    const personalizeEmail = EmailUse.replace('{{nome}}', nome).replace('{{data}}', data).replace('{{hora}}', hora);

    await sendEmail(toEmail, 'Carteirinha Digital - Acesso', personalizeEmail);

    res.send('Enviado');
  } catch (err) {
    console.error('Erro ao enviar email:', err);
    next(err);
  }
});

module.exports = router;
