'use strict';

const WatcherNonInterruptibleError  = require('shark-watcher').NonInterruptibleError;
const Transformer                   = require('shark-transformer');
const TransformerAutoprefixer       = require('shark-transformer-autoprefixer');
const TransformerCleanCss           = require('shark-transformer-clean-css');
const TransformerCssComb            = require('shark-transformer-csscomb');
const TransformerStylus             = require('shark-transformer-stylus');
const extend                        = require('node.extend');
const co                            = require('co');
const VError                        = require('verror');

var TransformerStylusPostCss = Transformer.extend({
	optionsDefault: {
		stylus: {
			enabled: true
		},

		autoprefixer: {
			enabled: true
		},

		cleanCss: {
			enabled: true
		},

		cssComb: {
			enabled: true
		}
	},

	init: function() {
		this.options = extend({}, this.optionsDefault, this.options);
	},

	transformTree: function *() {
		return this.tree.forEachDestSeries(co.wrap(function *(destPath, srcCollection, done) {
			try {
				yield this.transformTreeConcreteDest(destPath, srcCollection);
				done();
			}
			catch (error) {
				done(new VError(error, 'StylusPostCss#transformTree'));
			}
		}.bind(this)));
	},

	transformTreeConcreteDest: function *(destPath, srcCollection) {
		try {
			srcCollection.forEach(function(srcFile) {
				var result = this.renderCssComb(
					srcFile.getContent()
				);
				srcFile.setContent(result);
			}.bind(this));
		}
		catch (error) {
			throw new VError(error, 'StylusPostCss#renderTreeDest');
		}
	},

	treeToTreePreprocess: function *() {
		if (this.options.stylus.enabled !== false) {
			try {
				this.tree = yield TransformerStylus.treeToTree(
					this.tree, this.logger, this.options.stylus
				);
			}
			catch (error) {
				throw new VError(error);
			}
		}
	},

	treeToTreePostprocess: function *() {
		if (this.options.autoprefixer.enabled) {
			this.tree = yield TransformerAutoprefixer.treeToTree(
				this.tree, this.logger, this.options.autoprefixer
			);
		}

		if (this.options.cssComb.enabled !== false) {
			this.tree = yield TransformerCssComb.treeToTree(
				this.tree, this.logger, this.options.cssComb
			);
		}

		if (this.options.cleanCss.enabled !== false) {
			this.tree = yield TransformerCleanCss.treeToTree(
				this.tree, this.logger, this.options.cleanCss
			);
		}
	},

	treeToTree: function *() {
		try {
			yield this.tree.fillContent();

			yield this.treeToTreePreprocess();
			yield this.treeToTreePostprocess();

			return this.tree;
		}
		catch (error) {
			throw new VError(error, 'StylusPostCss#treeToTree');
		}
	}
});

TransformerStylusPostCss.Stylus = TransformerStylus.Stylus;

module.exports = TransformerStylusPostCss;