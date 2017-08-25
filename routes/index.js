const express = require('express');

const router = express.Router();

router.get('/', (req, res, _next) => {
  res.json({ message: 'It works!' });
});

module.exports = router;
