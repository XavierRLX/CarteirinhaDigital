const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const emailRoutes = require('./Routes/emailRoutes');

app.use('/email', emailRoutes);
app.post('/email/sendEmailUse', emailRoutes);

const app = express();
const port = 3000;

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));

// Servindo arquivos estáticos
app.use('/style', express.static(path.join(__dirname, 'public/style')));
app.use('/javaScript', express.static(path.join(__dirname, 'public/javaScript')));

// Definindo rotas dinamicamente
const routes = [
  { path: '/', file: 'index.html' },
  { path: '/login', file: 'login.html' },
  { path: '/carteirinhaDigital', file: 'carteirinhaDigital.html' },
  { path: '/cadastroUsu', file: 'cadastroUsu.html' },
];

routes.forEach(route => {
  app.get(route.path, (req, res) => {
    const indexPath = path.join(__dirname, `public/html/${route.file}`);
    res.sendFile(indexPath);
  });
});

// Inicializando o servidor
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
