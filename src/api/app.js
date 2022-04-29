const express = require('express');
const session = require('express-session');
const path = require('path');
const { SESSION_TOKEN } = require('../config');

const app = express();
const userRoutes = require('./routes/User');
const recipeRoutes = require('./routes/Recipe');
const authRoutes = require('./routes/Auth');

app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '..', 'uploads')));
app.use(session({ secret: SESSION_TOKEN, resave: false, saveUninitialized: true }));
app.use(userRoutes);
app.use(recipeRoutes);
app.use(authRoutes);

// Não remover esse end-point, ele é necessário para o avaliador
app.get('/', (request, response) => {
  response.send();
});
// Não remover esse end-point, ele é necessário para o avaliador

module.exports = app;
