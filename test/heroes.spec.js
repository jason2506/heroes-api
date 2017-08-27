/* eslint no-unused-expressions: off */

const chai = require('chai');
const chaiHttp = require('chai-http');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const expect = chai.expect;
chai.use(chaiHttp);

describe('GET /heroes', () => {
  // prepare data for test cases
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

  const heroProfiles = [
    {
      str: 2,
      int: 7,
      agi: 9,
      luk: 7,
    },
    {
      str: 9,
      int: 1,
      agi: 4,
      luk: 5,
    },
  ];

  const heroesWithProfiles = [];
  for (let i = 0, n = heroes.length; i < n; i++) {
    const hero = heroes[i];
    const profile = heroProfiles[i];
    heroesWithProfiles.push(Object.assign({}, hero, { profile }));
  }

  const auth = { name: 'name', password: 'password' };

  // replace the `request()` function with mock object
  const requestStub = sinon.stub();
  const router = proxyquire('../routes/heroes', { '../utils/request': requestStub });
  const app = proxyquire('../app', { './routes/heroes': router });

  beforeEach(() => {
    requestStub.reset();

    // define default stub behavior
    requestStub
      .withArgs({ path: '/heroes' })
      .resolves(JSON.stringify(heroes));

    const postBody = JSON.stringify(auth);
    requestStub
      .withArgs({
        protocol: 'https:',
        method: 'POST',
        path: '/auth',
      }, postBody)
      .resolves('OK');

    for (let i = 0, n = heroes.length; i < n; i++) {
      const hero = heroes[i];
      const profile = heroProfiles[i];
      requestStub
        .withArgs({ path: `/heroes/${ hero.id }/profile` })
        .resolves(JSON.stringify(profile));
    }
  });

  it('should return a list of public heroes', (done) => {
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

  it('should return error message if request is rejected', (done) => {
    // overwrite default `request({ path: '/heroes' })` behavior
    const error = new Error('Unknown Error');
    error.status = 999;
    requestStub
      .withArgs({ path: '/heroes' })
      .rejects(error);

    chai.request(app)
      .get('/heroes')
      .end((err, res) => {
        expect(err).to.be.an('Error');
        expect(res).to.have.status(error.status);
        expect(res.body).to.deep.equal(error.message);

        done();
      });
  });
});
