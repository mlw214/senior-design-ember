App.DownloadLinkView = Ember.View.extend({
	tagName: 'a',
	classNames: ['btn', 'btn-default', 'btn-sm', 'horz-btn'],
	attributeBindings: ['href'],
	href: function () {
		var id = this.get('controller.id');
		return '/experiments/' + id + '/download';
	}.property()
});