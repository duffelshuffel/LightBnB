const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {

  return pool.query(`
  SELECT * 
  FROM users
  WHERE email = $1
  ;`, [email])
    .then(res => {
      return Promise.resolve(res.rows[0])
    })
};

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool.query(`
  SELECT *
  FROM users
  WHERE id = $1
  ;`, [id])
    .then(res => {
      return Promise.resolve(res.rows[0]);
    })
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {

  return pool.query(`
  INSERT INTO users (
    name, email, password) 
    VALUES (
    $1, $2, $3)
    RETURNING *;
  `, [user.name, user.email, user.password])
    .then(res => {
      return Promise.resolve(res.rows[0]);
    })
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  // return getAllProperties(null, 2);

  return pool.query(`
  SELECT properties.*, reservations.*, AVG(rating) AS average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON property_reviews.property_id = properties.id
    JOIN users ON reservations.guest_id = $2
    WHERE reservations.guest_id = $2
    AND reservations.end_date < NOW()::date
    GROUP BY properties.id, reservations.id 
    ORDER BY start_date
    LIMIT $1;
  `, [limit, guest_id])
    .then(res => {
      return Promise.resolve(res.rows);
    })
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */


const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  let queryString = `
  SELECT properties.*, AVG(property_reviews.rating) AS average_rating 
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length}`
  }

  

  if (!options.owner_id) {}
  else if(options.owner_id && queryParams.length === 0) {
    queryParams.push(options.owner_id);
    querySring += `WHERE owner_id = $${queryParams.length}`
  } else {
    queryParams.push(options.owner_id);
    querySring += `AND owner_id = $${queryParams.length}`
  }

  if (!options.minimum_price_per_night) {}
  else if (options.minimum_price_per_night && !options.city) {
    queryParams.push(options.minimum_price_per_night);
    queryParams[queryParams.length - 1] = queryParams[queryParams.length - 1].concat('00');
    queryString += `WHERE cost_per_night >= $${queryParams.length}`
  } else if (options.minimum_price_per_night && options.city) {
    queryParams.push(options.minimum_price_per_night);
    queryParams[queryParams.length - 1] = queryParams[queryParams.length - 1].concat('00');
    queryString += ` AND cost_per_night >= $${queryParams.length}`
  } 

  if (!options.maximum_price_per_night) {
  }
  else if (options.maximum_price_per_night && queryParams.length === 0) {
    queryParams.push(options.maximum_price_per_night);
    queryParams[queryParams.length - 1] = queryParams[queryParams.length - 1].concat('00');
    queryString += `WHERE cost_per_night <= $${queryParams.length}`
  } else {
    queryParams.push(options.maximum_price_per_night);
    queryParams[queryParams.length - 1] = queryParams[queryParams.length - 1].concat('00');
    queryString += ` AND cost_per_night <= $${queryParams.length}`
  }

  
  queryString += `
  GROUP BY properties.id\n`
  
  if (!options.minimum_rating) {

  } else if (options.minimum_rating && queryParams.length === 0) {
    
    queryParams.push(options.minimum_rating);
    console.log(typeof queryParams[0], queryParams)
    queryString += `HAVING AVG(property_reviews.rating) >= $${queryParams.length}`
  } else {
    queryParams.push(options.minimum_rating);
    console.log(typeof queryParams[0], queryParams)
    queryString += `HAVING AVG(property_reviews.rating) >= $${queryParams.length}`
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

console.log(queryString)
  return pool.query(queryString, queryParams)
    .then(res => res.rows);
}

exports.getAllProperties = getAllProperties;





/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
