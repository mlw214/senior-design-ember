App.FlowplayerView = Ember.View.extend({
  didInsertElement: function () {
    $(this.$()).flowplayer({
      playlist: [
        [
          { flash: 'myStream' }
        ]
      ]
    });
  }
});