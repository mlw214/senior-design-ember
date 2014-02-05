App.TempTransform = DS.Transform.extend({
  serialize: function (value) {
    return {
      monitor: value.monitor,
      bound: value.bound,
      auto: value.auto,
      lower: value.lower,
      upper: value.upper
    };
  },
  deserialize: function (value) {
    return {
      monitor: value.monitor,
      bound: value.bound,
      auto: value.auto,
      lower: value.lower,
      upper: value.upper
    };
  }
});
App.ColorTransform = DS.Transform.extend({
  serialize: function (value) {
    return {
      monitor: value.monitor,
      bound: value.bound,
      auto: value.auto,
      color: value.color
    };
  },
  deserialize: function (value) {
    return {
      monitor: value.monitor,
      bound: value.bound,
      auto: value.auto,
      color: value.color
    };
  }
});

App.Experiment = DS.Model.extend({
  name: DS.attr('string'),
  start: DS.attr('date', {
    defaultValue: function () { return new Date(); }
  }),
  stop: DS.attr('date'),
  cancelled: DS.attr('boolean', { defaultValue: false }),
  rate: DS.attr('number', { defaultValue: 1 }),
  contact: DS.attr('string', { defaultValue: 'none' }),
  description: DS.attr('string'),
  gas: DS.attr('temp', {
    defaultValue: {
      monitor: true,
      bound: false,
      auto: false,
      lower: 0,
      upper: 0
    }
  }),
  liquid: DS.attr('temp', {
    defaultValue: {
      monitor: true,
      bound: false,
      auto: false,
      lower: 0,
      upper: 0
    }
  }),
  color: DS.attr('color', {
    defaultValue: {
      monitor: true,
      bound: false,
      auto: false,
      color: '#e5e5e5'
    }
  })
});