const http = require('http');

const express = require('express');

const router = express.Router();

const request = (path) => {
  const options = {
    hostname: 'hahow-recruit.herokuapp.com',
    headers: { 'Content-Type': 'application/json' },
    path,
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        // start getting data from the data source
        const chunks = [];
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          // return response with body once finishing receiving all of chunks
          resolve(chunks.join(''));
        });
      } else {
        // something went wrong!
        // wrap status code and message of response into an error object
        const err = new Error(res.statusMessage || '');
        err.status = res.statusCode;

        // invoke error handler with the error object
        reject(err);
      }
    });

    // handle exception while sending request to the data source
    req.on('error', reject);

    req.end();
  });
};

// fetch all public hero data
router.get('/', (req, res, next) => {
  request('/heroes')
    .then(JSON.parse)
    .then((heroes) => res.json(200, heroes))
    .catch(next);
});

module.exports = router;
