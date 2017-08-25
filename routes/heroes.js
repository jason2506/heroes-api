const http = require('http');

const express = require('express');

const router = express.Router();

// fetch all public hero data
router.get('/', (req, res, _next) => {
  const options = {
    hostname: 'hahow-recruit.herokuapp.com',
    path: '/heroes',
  };

  const delegateReq = http.request(options, (delegateRes) => {
    // start getting data from the data source
    const chunks = [];
    delegateRes.on('data', (chunk) => {
      chunks.push(chunk);
    });

    delegateRes.on('end', () => {
      // reconstruct and return result object once finishing receiving all of chunks
      const result = JSON.parse(chunks.join(''));
      res.json(delegateRes.statusCode, result);
    });
  });

  delegateReq.end();
});

module.exports = router;
