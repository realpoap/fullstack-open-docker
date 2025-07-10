const mongoose = require('mongoose')
const Todo = require('./models/Todo')
const { MONGO_URL } = require('../util/config')

if (MONGO_URL && !mongoose.connection.readyState) mongoose.connect(process.env.MONGO_URL)

console.info('MONGO_URL is:', process.env.MONGO_URL);

module.exports = {
  Todo
}
