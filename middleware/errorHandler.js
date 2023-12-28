const path = require('path');

const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Log the error for debugging purposes
  
    // Check for specific error types and handle accordingly
    if (err instanceof SyntaxError && 'body' in err && err.status === 400) {
      return res.status(400).send({ error: 'Bad request, invalid JSON' });
    }
    res.status(500).sendFile(path.join(__dirname, '../views/admin/error.ejs'));

  };
  
module.exports = errorHandler;
  