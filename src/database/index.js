const mongoose = require('mongoose');

const { MONGO_DB_URL } = require('../config');

mongoose.connect(MONGO_DB_URL);

module.exports = mongoose;