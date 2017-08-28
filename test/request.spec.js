const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');

const config = require('../config');
const request = require('../utils/request');

const expect = chai.expect;
chai.use(chaiAsPromised);

const baseURL = `http://${ config.dataSourceHost }`;

describe('request()', () => {
  it('should return a promise of response', () => {
    const heroes = [
      {
        id: 1,
        name: 'hero1',
        image: 'hero1.jpg',
      },
      {
        id: 2,
        name: 'hero2',
        image: 'hero2.jpg',
      },
    ];

    nock(baseURL)
      .get('/heroes')
      .reply(200, heroes);

    const reqPromise = request({ path: '/heroes' })
      .then(JSON.parse);

    return expect(reqPromise).to.eventually.deep.equal(heroes);
  });

  it('should reject with an error object with status code if response is not valid', () => {
    // [NOTE] There is no way to specify `res.statusMessage` with nock.
    // See: https://github.com/node-nock/nock/issues/469
    nock(baseURL)
      .get('/auth')
      .reply(400);

    const reqPromise = request({ path: '/auth' });
    return expect(reqPromise).to.be.rejectedWith(Error, '')
      .and.eventually.have.property('status', 400);
  });

  it('should reject with an error object if the request is failed', () => {
    const errorMessage = 'BOOOOOOM';
    nock(baseURL)
      .get('/error')
      .replyWithError(errorMessage);

    const reqPromise = request({ path: '/error' });
    return expect(reqPromise).to.be.rejectedWith(errorMessage);
  });

  it('should support POST method with body', () => {
    const data = { foo: 'bar', abc: 123 };
    nock(baseURL)
      .post('/post', data)
      .reply(200, 'OK');

    const options = { method: 'POST', path: '/post' };
    const reqPromise = request(options, JSON.stringify(data));
    return expect(reqPromise).to.eventually.equal('OK');
  });

  it('should support https requests', () => {
    const data = { user: 'hahow', password: 'rocks' };
    nock('https://hahow-recruit.herokuapp.com')
      .post('/auth', data)
      .reply(200, 'OK');

    const options = {
      protocol: 'https:',
      method: 'POST',
      path: '/auth',
    };

    const reqPromise = request(options, JSON.stringify(data));
    return expect(reqPromise).to.eventually.equal('OK');
  });
});
