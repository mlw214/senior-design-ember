App.ExperimentController = Ember.ObjectController.extend({
  modals: {
    gas$: null,
    liquid$: null,
    camera$: null
  },
  actions: {
    createExperiment: function () {
      var temp = this.store.createRecord('experiment', {
        name: 'test',
        description: 'blah',
        cancelled: false,
        rate: 1,
        camera: {
          used: true,
          bound: 'black',
          auto: false
        },
        gas: {
          used: true,
          lower: 5,
          upper: 55,
          auto: false
        },
        liquid: {
          used: true,
          lower: 6,
          upper: 55,
          auto: false
        },
        path: '/path/to/file'
      });
      console.log(temp);
      temp.save();
    },
    openLM: function () {
      if (this.modals.liquid$) {
        this.modals.liquid$.modal();
      } else {
        var liquid$ = $('#liquid-modal');
        this.modals.liquid$ = liquid$;
        this.modals.liquid$.modal();
      }
    },
    openGM: function () {
      if (this.modals.gas$) {
        this.modals.gas$.modal();
      } else {
        var gas$ = $('#gas-modal');
        this.modals.gas$ = gas$;
        this.modals.gas$.modal();
      }
    },
    openCM: function () {
      if (this.modals.camera$) {
        this.modals.camera$.modal();
      } else {
        var camera$ = $('#camera-modal');
        this.modals.camera$ = camera$;
        this.modals.camera$.modal();
      }
    }
  }
});