/** Express router providing heroes related routes. */

const express = require('express');

const request = require('../utils/request');

const router = express.Router();

const parseJSON = JSON.parse;

/**
 * A function that always returns true.
 *
 * @returns {Boolean}       Always true.
 */
const returnTrue = () => true;

/**
 * Checks if the request is authorized.
 *
 * @param {Request} req     The express request object to be checked.
 * @returns {Promise}       A promise that resolves to a boolean indicating whether the request is
 *                          authorized, or rejects with an error if authorization failed.
 */
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

/**
 * Fetches hero profile for given hero id.
 *
 * @param {Number} heroId   Heroes unique ID.
 * @returns {Promise}       A promise that resolves to a object contains profile of the specified
 *                          hero, or rejects with an error if request failed.
 */
const fetchHeroProfile = (heroId) =>
  request({ path: `/heroes/${ heroId }/profile` })
    .then(parseJSON);

/**
 * Fetches hero profile, and then attaches it to the hero object.
 *
 * @param {Object} hero     A hero object.
 * @returns {Promise}       A promise that resolves to the hero object with its profile, or rejects
 *                          with an error if request failed.
 */
const fetchAndAttachHeroProfile = (hero) =>
  fetchHeroProfile(hero.id)
    .then((profile) => Object.assign(hero, { profile }));

/**
 * Fetches and attaches profile for each of the hero objects.
 *
 * @param {Array} heroes    A list of hero objects.
 * @returns {Promise}       A promise that resolves to the array of hero objects and each of them
 *                          have their own profile data, or rejects with an error if request
 *                          failed.
 */
const fetchAndAttachAllHeroProfiles = (heroes) =>
  Promise.all(heroes.map(fetchAndAttachHeroProfile));

/**
 * Fetch all hero objects, and then attach profile for each of them if the request is authorized.
 *
 * @param {Boolean} authorized
 *                          A boolean value indicating whether the request is authorized.
 * @returns {Promise}       A promise that resolves to the array of hero objects, or rejects with
 *                          an error if request failed. If authorized is true, then each of the
 *                          object will contain their own profile data.
 */
const fetchHeroes = (authorized) => {
  const promise = request({ path: '/heroes' })
    .then(parseJSON);

  return authorized
    ? promise.then(fetchAndAttachAllHeroProfiles)
    : promise;
};

/**
 * Fetches hero objects and its profile (if the request is authorized) in parallel.
 *
 * @param {Number} heroId   Heroes unique ID.
 * @param {Boolean} authorized
 *                          A boolean value indicating whether the request is authorized.
 * @returns {Promise}       A promise that resolves to the hero object with given id, or rejects
 *                          with an error if request failed. If authorized is true, then the
 *                          object will contain its profile data as well.
 */
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
 *          -X GET "https://hahow-heroes-api.herokuapp.com/heroes"
 *
 * @apiExample {curl} Example Usage (Authorized)
 *     curl -H "Accept: application/json" \
 *          -H "Content-Type: application/json" \
 *          -H "Name: hahow" -H "Password: rocks" \
 *          -X GET "https://hahow-heroes-api.herokuapp.com/heroes"
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
 *          -X GET "https://hahow-heroes-api.herokuapp.com/heroes/1"
 *
 * @apiExample {curl} Example Usage (Authorized)
 *     curl -H "Accept: application/json" \
 *          -H "Content-Type: application/json" \
 *          -H "Name: hahow" -H "Password: rocks" \
 *          -X GET "https://hahow-heroes-api.herokuapp.com/heroes/1"
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
