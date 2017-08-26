const express = require('express');

const request = require('../utils/request');

const router = express.Router();

// fetch all public hero data
router.get('/', (req, res, next) => {
  request('/heroes')
    .then(JSON.parse)
    .then((heroes) => res.json(200, heroes))
    .catch(next);
});

module.exports = router;
