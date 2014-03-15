App.RecordController = Ember.ObjectController.extend({
  needs: 'archiveIndex',

  actions: {
    download: function () {
      var id = this.get('id');
      Ember.$.get('/experiments/' + id + '/download').fail(function (jqXHR) {
        console.log(jqXHR);
      });
    },
    delete: function () {
      var self = this;
      
      /*Ember.$.ajax({
        url: '/experiments/' + id,
        type: 'delete'
      }).done(function (response) {
        self.transitionToRoute('archive');
      }).fail(function (jqXHR) {
        console.log(jqXHR);
      });*/
      this.get('model').destroyRecord().then(function () {
        self.transitionToRoute('archive');
      });
    }
  }
});