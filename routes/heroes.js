const express = require('express');

const request = require('../utils/request');

const router = express.Router();

// fetch all public hero data
router.get('/', (req, res, next) => {
  request({ path: '/heroes' })
    .then(JSON.parse)
    .then((heroes) => res.status(200).json(heroes))
    .catch(next);
});

module.exports = router;
