App.Experiment = DS.Model.extend({
  name: DS.attr(),
  start: DS.attr('date'),
  stop: DS.attr('date'),
  cancelled: DS.attr(),
  rate: DS.attr(),
  contact: DS.attr(),
  description: DS.attr(),
  camera: {
    used: DS.attr(),
    bound: DS.attr(),
    auto: DS.attr()
  },
  gas: {
    used: DS.attr(),
    lower: DS.attr(),
    upper: DS.attr(),
    auto: DS.attr()
  },
  liquid: {
    used: DS.attr(),
    lower: DS.attr(),
    upper: DS.attr(),
    auto: DS.attr()
  },
  path: DS.attr()
});