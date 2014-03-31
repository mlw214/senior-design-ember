App.SensorsController = Ember.Controller.extend({
  needs: 'application',
  hidden: function () {
    var appCont = this.get('controllers.application'),
        props = appCont.getProperties('private', 'owner');

    return (props.private && !props.owner);
  }.property('controllers.application.private',
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
    },
    resetAlerts: function () {
      var self = this;
      Ember.$.get('reset-alerts').then(function (response) {
        if (response.reset) {
          self.set('controllers.application.alerted', false);
        }
      });
    }
  }
});