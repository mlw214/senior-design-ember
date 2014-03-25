App.ColorInput = Ember.TextField.extend({
  type: 'color',
  // WHY DO I NEED TO DO THIS!?!?!
  // Guess: Because I'm extending TextField.
  disabled: function () {
    return this.get('targetObject.noColorBound');
  }.property('targetObject.noColorBound'),
  disabledObserver: function () {
    var disabled = this.get('targetObject.noColorBound');
    this.set('disabled', disabled);
    if (!Modernizr.inputtypes.color) {
      // Set hidden(?) original element's disabled attribute manually.
      // Needed to get Spectrum to work correctly (i.e., not always disabled).
      $(this.$()).attr('disabled', disabled);
      if (disabled) {
        $(this.$()).spectrum('disable');
      } else {
        $(this.$()).spectrum('enable');
      }
    }
  }.observes('targetObject.noColorBound'),
  didInsertElement: function () {
    if (!Modernizr.inputtypes.color) {
      $(this.$()).spectrum();
    }
  }
});