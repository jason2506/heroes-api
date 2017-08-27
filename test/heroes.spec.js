/* eslint no-unused-expressions: off */

const chai = require('chai');
const chaiHttp = require('chai-http');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const expect = chai.expect;
chai.use(chaiHttp);

// replace the `request()` function with stub object
const requestStub = sinon.stub();
const router = proxyquire('../routes/heroes', { '../utils/request': requestStub });
const app = proxyquire('../app', { './routes/heroes': router });

// prepare data for test cases
const heroes = [
  { id: 1, name: 'hero1', image: 'hero1.jpg' },
  { id: 2, name: 'hero2', image: 'hero2.jpg' },
];

const heroProfiles = [
  { str: 2, int: 7, agi: 9, luk: 7 },
  { str: 9, int: 1, agi: 4, luk: 5 },
];

const heroesWithProfiles = [];
for (let i = 0, n = heroes.length; i < n; i++) {
  const hero = heroes[i];
  const profile = heroProfiles[i];
  heroesWithProfiles.push(Object.assign({}, hero, { profile }));
}

const nonExistentHeroId = 999999;
const notFoundError = new Error('Not Found');
notFoundError.status = 404;

const correctAuth = { name: 'name', password: 'password' };
const wrongAuth = { name: 'foo', password: 'bar' };
const authError = new Error('Unauthorized');
authError.status = 401;

const initRequestStub = () => {
  requestStub.reset();

  // define default stub behavior
  requestStub
    .withArgs({ path: '/heroes' })
    .resolves(JSON.stringify(heroes));

  const authRequestOptions = {
    protocol: 'https:',
    method: 'POST',
    path: '/auth',
  };

  const correctPostBody = JSON.stringify(correctAuth);
  requestStub
    .withArgs(authRequestOptions, correctPostBody)
    .resolves('OK');

  const wrongPostBody = JSON.stringify(wrongAuth);
  requestStub
    .withArgs(authRequestOptions, wrongPostBody)
    .rejects(authError);

  requestStub
    .withArgs({ path: `/heroes/${ nonExistentHeroId }` })
    .rejects(notFoundError);

  for (let i = 0, n = heroes.length; i < n; i++) {
    const hero = heroes[i];
    const profile = heroProfiles[i];

    requestStub
      .withArgs({ path: `/heroes/${ hero.id }` })
      .resolves(JSON.stringify(hero));

    requestStub
      .withArgs({ path: `/heroes/${ hero.id }/profile` })
      .resolves(JSON.stringify(profile));
  }
};

describe('GET /heroes', () => {
  beforeEach(initRequestStub);

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

  it('should return heroes with profile if the request is authorized', (done) => {
    chai.request(app)
      .get('/heroes')
      .set('Name', correctAuth.name)
      .set('Password', correctAuth.password)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.deep.equal(heroesWithProfiles);

        done();
      });
  });

  it('should reject the request if provided auth info is wrong', (done) => {
    chai.request(app)
      .get('/heroes')
      .set('Name', wrongAuth.name)
      .set('Password', wrongAuth.password)
      .end((err, res) => {
        expect(err).to.be.an('Error');
        expect(res).to.have.status(authError.status);
        expect(res.body).to.deep.equal(authError.message);

        done();
      });
  });
});

describe('GET /heroes/:heroId', () => {
  beforeEach(initRequestStub);

  it('should return hero with the specified id', (done) => {
    const hero = heroes[0];
    chai.request(app)
      .get(`/heroes/${ hero.id }`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.deep.equal(hero);

        done();
      });
  });

  it('should return an error with 404 code if the specified hero id is nonexistent', (done) => {
    chai.request(app)
      .get(`/heroes/${ nonExistentHeroId }`)
      .end((err, res) => {
        expect(err).to.be.an('Error');
        expect(res).to.have.status(notFoundError.status);
        expect(res.body).to.deep.equal(notFoundError.message);

        done();
      });
  });
});
