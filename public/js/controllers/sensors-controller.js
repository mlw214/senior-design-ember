App.SensorsController = Ember.Controller.extend({
  needs: 'application',
  disabled: function () {
    var running = this.get('controllers.application').get('running'),
        owner = this.get('controllers.application').get('owner');
    this.set('isDisabled', running && !owner);
  }.observes('controllers.application.running',
              'controllers.application.owner'),
  actions: {
    toggleRelay: function () {
      var state = !this.get('controllers.application').get('relay');
      Ember.$.ajax({
        url: '/relay',
        type: 'put',
        data: { relay: state }
      }).fail(App.toastrFailCallback);
    },
    toggleCanceller: function () {
      var state = !this.get('controllers.application').get('canceller');
      Ember.$.ajax({
        url: '/canceller',
        type: 'put',
        data: { relay: state }
      }).fail(App.toastrFailCallback);
    }
  }
});