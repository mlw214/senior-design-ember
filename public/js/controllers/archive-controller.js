App.ArchiveIndexController = Ember.ArrayController.extend({
  queryParams: ['page'],
  page: 1,
  prevPage: function () {
    var page = parseInt(this.get('page'), 10);
    if (page > 1) {
      return page - 1;
    } else return 1;
  }.property('page'),
  nextPage: function () {
    var page = parseInt(this.get('page'), 10),
        pages = this.get('pages');
    if (page < pages) return page + 1;
    else return pages;
  }.property('page', 'pages'),
  atBeginning: function () {
    var page = parseInt(this.get('page'), 10);
    return page <= 1;
  }.property('page'),
  atEnd: function () {
    var page = parseInt(this.get('page'), 10),
        pages = this.get('pages');
    return page >= pages;
  }.property('page', 'pages')
});