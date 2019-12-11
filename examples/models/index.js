var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var configSchema = new Schema({
  constract: String, // String is shorthand for {type: String}
  network: String,
  eviroment: String,
  feeClaim: Number,
  date: { type: Date, default: Date.now }
});
var config = mongoose.model('Config', configSchema);

module.exports = config;
