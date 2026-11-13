const fs = require('fs');
const path = require('path');

const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const log = `${timestamp} - ${req.method} ${req.url} - ${req.ip}\n`;
  
  // Write to log file
  fs.appendFile(
    path.join(__dirname, '../logs/access.log'),
    log,
    (err) => {
      if (err) console.error('Logging error:', err);
    }
  );
  
  next();
};

module.exports = logger;