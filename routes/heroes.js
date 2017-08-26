const http = require('http');

const express = require('express');

const router = express.Router();

// fetch all public hero data
router.get('/', (req, res, next) => {
  const options = {
    hostname: 'hahow-recruit.herokuapp.com',
    path: '/heroes',
  };

  const delegateReq = http.request(options, (delegateRes) => {
    if (delegateRes.statusCode === 200) {
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
    } else {
      // something went wrong!
      // wrap status code and message of response into an error object
      const err = new Error(delegateRes.statusMessage || '');
      err.status = delegateRes.statusCode;

      // invoke error handler with the error object
      next(err);
    }
  });

  delegateReq.end();
});

module.exports = router;
