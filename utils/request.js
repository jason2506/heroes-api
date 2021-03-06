/** Defines a help function which is used to send request to the data source. */

const http = require('http');
const https = require('https');

const config = require('../config');

/**
 * Sends HTTP requests to the pre-defined data source.
 *
 * @param {Object} options  The option object which will be passed to http.request().
 * @param {String} body     Optional body content which will be sent with the request.
 * @returns {Promise}       A promise that resolves to content of response body, or rejects with an
 *                          error if request failed.
 */
const request = (options, body) => {
  const headers = { 'Content-Type': 'application/json' };
  Object.assign(headers, options.headers);

  const allOptions = { hostname: config.dataSourceHost };
  Object.assign(allOptions, options, { headers });

  const protocol = options.protocol === 'https:'
    ? https
    : http;

  return new Promise((resolve, reject) => {
    const req = protocol.request(allOptions, (res) => {
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
