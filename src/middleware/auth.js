const jwt = require('jsonwebtoken');
const env = require('../config/env');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, env.JWT_SECRET);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentification requise' });
  }
}; 