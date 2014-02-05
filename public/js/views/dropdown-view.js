App.DropdownView = Ember.View.extend({
  tagName: 'li',
  classNames: ['dropdown'],
  classNameBindings: ['active'],

  activeChange: function () {
    var views = this.get('childViews');
    var val = (views.filterBy('active', 'active').get('length') ? 'active' : '');
    this.set('active', val);
  }.observes('childViews.@each.active')
});