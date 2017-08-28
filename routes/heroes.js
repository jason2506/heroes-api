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

/**
 * @api {get} /heroes                   List Heroes
 * @apiName ListHeroes
 * @apiGroup Heroes
 *
 * @apiHeader (Auth) {String} name      Auth Name for accessing Private Profile.
 * @apiHeader (Auth) {String} password  Auth Password.
 *
 * @apiSuccess {Object[]} heroes        List of Heroes.
 * @apiSuccess {Object} heroes.profile  Private Hero Profile.
 *
 * @apiExample {curl} Example Usage
 *     curl -H "Accept: application/json" \
 *          -H "Content-Type: application/json" \
 *          -X GET "http://localhost:3000/heroes"
 *
 * @apiExample {curl} Example Usage (Authorized)
 *     curl -H "Accept: application/json" \
 *          -H "Content-Type: application/json" \
 *          -H "Name: hahow" -H "Password: rocks" \
 *          -X GET "http://localhost:3000/heroes"
 *
 * @apiSuccessExample Success Response
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         id: "1",
 *         name: "Daredevil",
 *         image: "http://i.annihil.us/u/prod/marvel/i/mg/6/90/537ba6d49472b/standard_xlarge.jpg"
 *       },
 *       {
 *         id: "2",
 *         name: "Thor",
 *         image: "http://x.annihil.us/u/prod/marvel/i/mg/5/a0/537bc7036ab02/standard_xlarge.jpg"
 *       }
 *     ]
 *
 * @apiSuccessExample Success Response (Authorized)
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         id: "1",
 *         name: "Daredevil",
 *         image: "http://i.annihil.us/u/prod/marvel/i/mg/6/90/537ba6d49472b/standard_xlarge.jpg",
 *         profile: {
 *           str: 2,
 *           int: 7,
 *           agi: 9,
 *           luk: 7
 *         }
 *       },
 *       {
 *         id: "2",
 *         name: "Thor",
 *         image: "http://x.annihil.us/u/prod/marvel/i/mg/5/a0/537bc7036ab02/standard_xlarge.jpg",
 *         profile: {
 *           str: 8,
 *           int: 2,
 *           agi: 5,
 *           luk: 9
 *         }
 *       }
 *     ]
 *
 * @apiErrorExample Authentication Failed Response
 *     HTTP/1.1 401 Unauthorized
 *     "Unauthorized"
 */
router.get('/', (req, res, next) => {
  auth(req)
    .then(fetchHeroes)
    .then((heroes) => res.status(200).json(heroes))
    .catch(next);
});

/**
 * @api {get} /heroes/:heroId           Single Hero
 * @apiName SingleHero
 * @apiGroup Heroes
 *
 * @apiParam {Number} heroId            Heroes unique ID.
 *
 * @apiHeader (Auth) {String} name      Auth Name for accessing Private Profile.
 * @apiHeader (Auth) {String} password  Auth Password.
 *
 * @apiSuccess {Number} id              Heroes unique ID.
 * @apiSuccess {String} name            Name of the Hero.
 * @apiSuccess {String} image           Image of the Hero.
 * @apiSuccess {Object} profile         Private Hero Profile.
 *
 * @apiExample {curl} Example Usage
 *     curl -H "Accept: application/json" \
 *          -H "Content-Type: application/json" \
 *          -X GET "http://localhost:3000/heroes/1"
 *
 * @apiExample {curl} Example Usage (Authorized)
 *     curl -H "Accept: application/json" \
 *          -H "Content-Type: application/json" \
 *          -H "Name: hahow" -H "Password: rocks" \
 *          -X GET "http://localhost:3000/heroes/1"
 *
 * @apiSuccessExample Success Response
 *     HTTP/1.1 200 OK
 *     {
 *       id: "1",
 *       name: "Daredevil",
 *       image: "http://i.annihil.us/u/prod/marvel/i/mg/6/90/537ba6d49472b/standard_xlarge.jpg"
 *     }
 *
 * @apiSuccessExample Success Response (Authorized)
 *     HTTP/1.1 200 OK
 *     {
 *       id: "1",
 *       name: "Daredevil",
 *       image: "http://i.annihil.us/u/prod/marvel/i/mg/6/90/537ba6d49472b/standard_xlarge.jpg",
 *       profile: {
 *         str: 2,
 *         int: 7,
 *         agi: 9,
 *         luk: 7
 *       }
 *     }
 *
 * @apiErrorExample Error Response
 *     HTTP/1.1 404 Not Found
 *     "Not Found"
 *
 * @apiErrorExample Authentication Failed Response
 *     HTTP/1.1 401 Unauthorized
 *     "Unauthorized"
 */
router.get('/:heroId', (req, res, next) => {
  auth(req)
    .then(fetchHero(req.params.heroId))
    .then((hero) => res.status(200).json(hero))
    .catch(next);
});

module.exports = router;
