App.RecordController = Ember.ObjectController.extend({
  needs: 'archiveIndex',

  actions: {
    nextRecord: function () {
      var ac = this.get('controllers.archiveIndex'),
          model = this.get('model'), index, rec;

      console.log(model);
      console.log(ac.get('model'));
      index = ac.indexOf(model);
      console.log(index);
    }
  }
});