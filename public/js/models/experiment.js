App.TempTransform = DS.Transform.extend({
  serialize: function (value) {
    if (value) {  
      return {
        save: value.save,
        bound: value.bound,
        auto: value.auto,
        lower: value.lower,
        upper: value.upper
      };
    }
    return null;
  },
  deserialize: function (value) {
    if (value) {  
      return {
        save: value.save,
        bound: value.bound,
        auto: value.auto,
        lower: value.lower,
        upper: value.upper
      };
    }
    return null;
  }
});
App.ColorTransform = DS.Transform.extend({
  serialize: function (value) {
    if (value) {  
      return {
        save: value.save,
        bound: value.bound,
        auto: value.auto,
        color: value.color
      };
    }
    return null;
  },
  deserialize: function (value) {
    if (value) {  
      return {
        save: value.save,
        bound: value.bound,
        auto: value.auto,
        color: value.color
      };
    }
    return null;
  }
});

App.Experiment = DS.Model.extend({
  name: DS.attr('string'),
  start: DS.attr('date'),
  stop: DS.attr('date'),
  cancelled: DS.attr('boolean', { defaultValue: false }),
  rate: DS.attr('number', { defaultValue: 1 }),
  contact: DS.attr('string', { defaultValue: 'none' }),
  description: DS.attr('string'),
  gas: DS.attr('temp', {
    defaultValue: {
      save: true,
      bound: false,
      auto: false,
      lower: 0,
      upper: 0
    }
  }),
  liquid: DS.attr('temp', {
    defaultValue: {
      save: true,
      bound: false,
      auto: false,
      lower: 0,
      upper: 0
    }
  }),
  color: DS.attr('color', {
    defaultValue: {
      save: false,
      bound: false,
      auto: false,
      color: '#e5e5e5'
    }
  })
});