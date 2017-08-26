/* eslint no-unused-expressions: off */

const chai = require('chai');
const chaiHttp = require('chai-http');
const nock = require('nock');

const app = require('../app');

const expect = chai.expect;
chai.use(chaiHttp);

describe('GET /heroes', () => {
  it('should return a list of public heroes', (done) => {
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

    chai.request(app)
      .get('/heroes')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.deep.equal(heroes);

        done();
      });
  });

  it('should return an error if the data source does not correctly return result', (done) => {
    nock('http://hahow-recruit.herokuapp.com')
      .get('/heroes')
      .reply(404);

    chai.request(app)
      .get('/heroes')
      .end((err, res) => {
        expect(err).to.be.an('Error');
        expect(res).to.have.status(404);

        // [NOTE] There is no way to specify `res.statusMessage` with nock.
        // See: https://github.com/node-nock/nock/issues/469
        expect(res.body).to.deep.equal('');

        done();
      });
  });
});
