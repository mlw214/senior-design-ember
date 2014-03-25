var mongoose = require('mongoose'),
    paginate = require('../lib/paginate');

var experimentSchema = new mongoose.Schema({
  name: { type: String, index: true },
  owner: { type: String, index: true },
  friends: [String],
  start: { type: Date, default: Date.now },
  stop: { type: Date, default: null },
  cancelled: Boolean,
  rate: Number,
  private: Boolean,
  contact: String,
  description: { type: String, default: '' },
  color: {
    bound: Boolean,
    boundType: String,
    auto: Boolean,
    lower: String,
    upper: String
  },
  gas: {
    save: Boolean,
    bound: Boolean,
    lower: Number,
    upper: Number,
    auto: Boolean
  },
  liquid: {
    save: Boolean,
    bound: Boolean,
    lower: Number,
    upper: Number,
    auto: Boolean
  },
  path: String
});

experimentSchema.statics.paginate = paginate;

module.exports = mongoose.model('Experiment', experimentSchema);