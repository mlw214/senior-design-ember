var mongoose = require('mongoose');

var experimentSchema = new mongoose.Schema({
  name: { type: String, index: true },
  owner: { type: String, index: true },
  friends: [String],
  start: { type: Date, default: Date.now },
  stop: { type: Date, default: null },
  cancelled: Boolean,
  rate: Number,
  contact: String,
  description: { type: String, default: '' },
  color: {
    monitor: Boolean,
    bound: Boolean,
    auto: Boolean,
    color: String
  },
  gas: {
    monitor: Boolean,
    bound: Boolean,
    lower: Number,
    upper: Number,
    auto: Boolean
  },
  liquid: {
    monitor: Boolean,
    bound: Boolean,
    lower: Number,
    upper: Number,
    auto: Boolean
  },
  path: String
});

module.exports = mongoose.model('Experiment', experimentSchema);