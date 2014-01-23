App.User = DS.Model.extend({
  username: DS.attr(),
  contact: {
    email: DS.attr(),
    cellphone: DS.attr(),
    carrier: DS.attr()
  }
});