App.FlowplayerView = Ember.View.extend({
  didInsertElement: function () {
    $(this.$()).flowplayer({
      live: true,
      autoplay: true,
      rtmp: 'rtmp://' + window.location.hostname + '/flvplayback',
      ratio: 3/4,
      swf: '//releases.flowplayer.org/5.4.3/flowplayer.swf',
      playlist: [
        [
          { flash: 'myStream' }
        ]
      ]
    });
  }
});