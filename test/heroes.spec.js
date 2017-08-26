/* eslint no-unused-expressions: off */

const chai = require('chai');
const chaiHttp = require('chai-http');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const expect = chai.expect;
chai.use(chaiHttp);

describe('GET /heroes', () => {
  let requestMock, router, app;

  beforeEach(() => {
    requestMock = sinon.mock('request');
    requestMock
      .once()
      .withExactArgs('/heroes');

    // replace the `request()` function with mock object
    router = proxyquire('../routes/heroes', { '../utils/request': requestMock });
    app = proxyquire('../app', { './routes/heroes': router });
  });

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

    const data = JSON.stringify(heroes);
    requestMock.resolves(data);

    chai.request(app)
      .get('/heroes')
      .end((err, res) => {
        requestMock.verify();

        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.deep.equal(heroes);

        done();
      });
  });

  it('should return error message if request is rejected', (done) => {
    const error = new Error('Unknown Error');
    error.status = 999;
    requestMock.rejects(error);

    chai.request(app)
      .get('/heroes')
      .end((err, res) => {
        requestMock.verify();

        expect(err).to.be.an('Error');
        expect(res).to.have.status(error.status);
        expect(res.body).to.deep.equal(error.message);

        done();
      });
  });
});
