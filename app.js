const express = require('express');
const logger = require('morgan');

const heroes = require('./routes/heroes');

const app = express();

app.use(logger('dev'));

app.use('/', express.static('docs'));
app.use('/heroes', heroes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, _next) => {
  res.status(err.status || 500);
  res.json(err.message);
});

module.exports = app;
