App.FlowplayerView = Ember.View.extend({
  didInsertElement: function () {
    $(this.$()).flowplayer({
      ratio: 5/12,
      rtmp: "rtmp://s3b78u0kbtx79q.cloudfront.net/cfx/st",
      playlist: [
        [
          { webm:  "http://stream.flowplayer.org/bauhaus/624x260.webm" },
          { mp4:   "http://stream.flowplayer.org/bauhaus/624x260.mp4" },
          { ogg:   "http://stream.flowplayer.org/bauhaus/624x260.ogv" },
          { flash: "mp4:bauhaus/624x260" }
        ]
      ]
    });
  }
});