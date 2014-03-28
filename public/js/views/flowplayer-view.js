App.FlowplayerView = Ember.View.extend({
  didInsertElement: function () {
    $(this.$()).flowplayer({
      live: true,
      rtmp: 'rtmp://192.168.2.14/flvplayback',
      ratio: 3/4,
      swf: '//releases.flowplayer.org/5.4.3/flowplayer.swf'
      playlist: [
        [
          { flash: 'myStream' }
        ]
      ]
    });
  }
});