const http = require('http');

const request = (options, body) => {
  const headers = { 'Content-Type': 'application/json' };
  Object.assign(headers, options.headers);

  const allOptions = { hostname: 'hahow-recruit.herokuapp.com' };
  Object.assign(allOptions, options, { headers });

  return new Promise((resolve, reject) => {
    const req = http.request(allOptions, (res) => {
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

    if (body) {
      req.write(body);
    }

    req.end();
  });
};

module.exports = request;
