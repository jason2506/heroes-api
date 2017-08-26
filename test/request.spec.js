/* eslint no-unused-expressions: off */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');

const request = require('../utils/request');

const expect = chai.expect;
chai.use(chaiAsPromised);

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

    nock('http://hahow-recruit.herokuapp.com')
      .get('/heroes')
      .reply(200, heroes);

    const reqPromise = request('/heroes')
      .then(JSON.parse);

    return expect(reqPromise).to.eventually.deep.equal(heroes);
  });

  it('should reject with an error object with status code if response is not valid', () => {
    // [NOTE] There is no way to specify `res.statusMessage` with nock.
    // See: https://github.com/node-nock/nock/issues/469
    nock('http://hahow-recruit.herokuapp.com')
      .get('/auth')
      .reply(400);

    const reqPromise = request('/auth');
    return expect(reqPromise).to.be.rejectedWith(Error, '')
      .and.eventually.have.property('status', 400);
  });

  it('should reject with an error object if the request is failed', () => {
    const errorMessage = 'BOOOOOOM';
    nock('http://hahow-recruit.herokuapp.com')
      .get('/error')
      .replyWithError(errorMessage);

    const reqPromise = request('/error');
    return expect(reqPromise).to.be.rejectedWith(errorMessage);
  });
});
