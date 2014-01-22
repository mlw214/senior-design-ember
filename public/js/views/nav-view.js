App.NavView = Ember.View.extend({
  tagName: 'li',
  classNameBindings: ['active'],

  activeChange: function () {
    var val = this.get('childViews.firstObject.active');
    this.set('active', val);
  }.observes('childViews.firstObject.active')
});