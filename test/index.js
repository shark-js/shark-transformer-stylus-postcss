'use strict';

const chai      = require('chai');
const coMocha   = require('co-mocha');
const expect    = chai.expect;
const Tree      = require('shark-tree');
const Logger    = require('shark-logger');
const path      = require('path');
const VError    = require('verror');
const sprintf   = require('extsprintf').sprintf;
const cofse     = require('co-fs-extra');

const TransformerStylusPostCss = require('../');

describe('Transformation', function() {
	before(function *() {
		this.logger = Logger({
			name: 'SharkTransformerStylusPosCss'
		});

		var dest = path.join(__dirname, './fixtures/blocks.css');
		var src = path.join(__dirname, './fixtures/blocks.styl');

		var files = {};
		files[dest] = src;

		this.filesTree = yield Tree(files, this.logger);

		this.browsers = [
			'Android 2.3',
			'Android >= 4',
			'Chrome >= 20',
			'Firefox >= 24', // Firefox 24 is the latest ESR
			'iOS >= 6',
			'Opera >= 12',
			'Safari >= 6'
		];
	});

	it('should generate and write to file stylus string', function *() {
		try {
			var tree = yield TransformerStylusPostCss.treeToTree(this.filesTree, this.logger, {
				autoprefixerOptions: {
					browsers: this.browsers
				}
			});
			yield tree.writeContentToFiles();
			var contentByStylus = yield cofse.readFile(path.join(__dirname, './fixtures/blocks.css'), {
				encoding: 'utf8'
			});

			var contentShouldBe = yield cofse.readFile(path.join(__dirname, './fixtures/blocks.expect.css'), {
				encoding: 'utf8'
			});

			expect(contentByStylus).equal(contentShouldBe);
		}
		catch (error) {
			console.error(sprintf('%r', error));
			throw new Error('error');
		}
	});
});
