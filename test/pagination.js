var mongoose = require('mongoose'),
    Experiment = require('../models/experiment');

mongoose.connect('mongodb://localhost/labv2');

Experiment.paginate({ owner: 'mlw214' }, 1, 25, function (err, pageCount, results) {
  if (err) return console.log(err);
  console.log(pageCount);
  if (results.length) {
	console.log(results);
  } else {
  	console.log('none');
  }
});