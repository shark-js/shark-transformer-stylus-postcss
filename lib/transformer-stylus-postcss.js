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

module.exports = Transformer.extend({
	optionsDefault: {

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
		try {
			this.tree = yield TransformerStylus.treeToTree(
				this.tree, this.logger, {}
			);
		}
		catch (error) {
			throw new VError(error);
		}

	},

	treeToTreePostprocess: function *() {
		this.tree = yield TransformerAutoprefixer.treeToTree(
			this.tree, this.logger, this.options.autoprefixerOptions
		);

		this.tree = yield TransformerCssComb.treeToTree(
			this.tree, this.logger, this.options.cssCombOptions
		);

		this.tree = yield TransformerCleanCss.treeToTree(
			this.tree, this.logger, this.options.cleanCssOptions
		);
	},

	treeToTree: function *() {
		try {
			yield this.tree.fillContent();

			yield this.treeToTreePreprocess();
			yield this.treeToTreePostprocess();

			//yield this.transformTree();

			return this.tree;
		}
		catch (error) {
			throw new VError(error, 'StylusPostCss#treeToTree');
		}
	}
});