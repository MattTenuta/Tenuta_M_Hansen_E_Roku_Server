const express = require('express');
const router = express.Router();

// import the sql package
const sql = require('mysql');
const creds = require('../config/user');

//create a pool of potential connections and use the sql user credentials to connect to your instance of mysql on your machine
const pool  = sql.createPool(creds);

router.get('/', (req, res) => {
    res.json({message: 'hit ums API root'});
})

//try to authenticate a user via the login route
router.post("/login", (req, res) => {
  console.log('hit the login route');
  console.log('user data:', req.body);

  pool.getConnection(function(err, connection) {
    if (err) throw err; // not connected!
   
    // Use the connection
    connection.query(`SELECT username, password FROM users WHERE username="${req.body.username}"`, function (error, results) {
      // When done with the connection, release it.
      connection.release();
   
      // Handle error after the release.
      if (error) throw error;

      let result = {message: ''}

      // what if the user doesnt exist? no username

      if (results.length == 0) {
        // no matching user name... maybe provide a sign up form/button?
        result.message = 'no user';
      } else if (results[0].password !== req.body.password) {
        // no matching password... mark the password on the client side
        result.message = 'wrong password';
      } else {
        result.message = 'Success',

        //get rid of the user password here because its sensitive info
        delete results[0].password;
        result.user = results[0];
      }
   
      // Don't use the connection here, it has been returned to the pool.
      res.json(result);
    });
  });
})

// retrieves all users from a database
router.get('/users', (req, res) => {

    pool.getConnection(function(err, connection) {
        if (err) throw err; // not connected!
       
        // Use the connection
        connection.query('SELECT * FROM users', function (error, results) {
          // When done with the connection, release it.
          connection.release();
       
          // Handle error after the release.
          if (error) throw error;

          results.forEach(user => {
            // sanatize data - get rid of what we dont need
            delete user.password;
            delete user.lname;
            delete user.fname;

            // if there is no avatar, set a default
            if(!user.avatar) {
              user.avatar = "temp_avatar.jpg";
            }
          })
       
          // Don't use the connection here, it has been returned to the pool.
          res.json(results);
        });
      });
})

// recieves one user from database
router.get('/users/:user', (req, res) => {
    console.log(req.params.user);
    pool.getConnection(function(err, connection) {
        if (err) throw err; // not connected!
       
        // Use the connection
        connection.query(`SELECT * FROM users WHERE id=${req.params.user}`, function (error, results) {
          // When done with the connection, release it.
          connection.release();
       
          // Handle error after the release.
          if (error) throw error;
          
          //remove any sensitive info from the dataset(s)
          delete results[0].password;
          delete results[0].fname;
          delete results[0].lname;

          // add a temp avatar if there isnt one
          if (results[0].avatar == null) {
            results[0].avatar = "temp_avatar.jpg";
          }

          console.log(results);
       
          // Don't use the connection here, it has been returned to the pool.
          res.json(results);
        });
      });
})

module.exports = router;