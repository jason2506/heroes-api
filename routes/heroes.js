const express = require('express');

const request = require('../utils/request');

const router = express.Router();

const parseJSON = JSON.parse;
const returnTrue = () => true;

// check if the request is authorized
const auth = (req) => {
  const name = req.get('Name');
  const password = req.get('Password');
  if (!name) {
    return Promise.resolve(false);
  }

  const body = JSON.stringify({ name, password });
  const options = {
    protocol: 'https:',
    method: 'POST',
    path: '/auth',
  };

  return request(options, body)
    .then(returnTrue);
};

// fetch hero profile for given hero id
const fetchHeroProfile = (heroId) =>
  request({ path: `/heroes/${ heroId }/profile` })
    .then(parseJSON);

// fetch hero profile, and then attach it to the hero object
const fetchAndAttachHeroProfile = (hero) =>
  fetchHeroProfile(hero.id)
    .then((profile) => Object.assign(hero, { profile }));

// fetch and attach profile for each of the hero objects
const fetchAndAttachAllHeroProfiles = (heroes) =>
  Promise.all(heroes.map(fetchAndAttachHeroProfile));

// fetch all hero objects, and then attach profile for each of them if the request is authorized
const fetchHeroes = (authorized) => {
  const promise = request({ path: '/heroes' })
    .then(parseJSON);

  return authorized
    ? promise.then(fetchAndAttachAllHeroProfiles)
    : promise;
};

// fetch hero objects and its profile (if the request is authorized) in parallel
const fetchHero = (heroId) => (authorized) => {
  const heroPromise = request({ path: `/heroes/${ heroId }` })
    .then(parseJSON);
  const profilePromise = authorized
    ? fetchHeroProfile(heroId)
    : void 0;

  return Promise.all([heroPromise, profilePromise])
    .then(([hero, profile]) => Object.assign(hero, { profile }));
};

// fetch all public hero data
router.get('/', (req, res, next) => {
  auth(req)
    .then(fetchHeroes)
    .then((heroes) => res.status(200).json(heroes))
    .catch(next);
});

// fetch single hero data
router.get('/:heroId', (req, res, next) => {
  auth(req)
    .then(fetchHero(req.params.heroId))
    .then((hero) => res.status(200).json(hero))
    .catch(next);
});

module.exports = router;
