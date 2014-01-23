window.App = Ember.Application.create();
App.getToken = function () {
  return localStorage.token;
};

App.ApplicationController = Ember.ObjectController.extend({
  needs: ['signin']
});

Ember.TextField.reopen({
  attributeBindings: ['required', 'autofocus']
});