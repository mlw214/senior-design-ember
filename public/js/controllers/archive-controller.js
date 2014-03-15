App.ArchiveIndexController = Ember.ArrayController.extend({
  page: 1,
  atBeginning: function () {
    var page = parseInt(this.get('page'), 10);
    return page <= 1;
  }.property('page'),
  atEnd: function () {
    var page = parseInt(this.get('page'), 10),
        pages = this.get('pages');
    return page >= pages;
  }.property('page', 'pages'),
  loadData: function (page) {
    var promise = this.store.find('experiment', { page: page });
    this.set('content', promise);
  },
  actions: {
    prevPage: function () {
      var page = this.get('page');
      this.set('page', --page);
      this.loadData(page);
    },
    nextPage: function () {
      var page = this.get('page');
      this.set('page', ++page);
      this.loadData(page);
    }
  }
});