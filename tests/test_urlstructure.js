import {URLStructure} from '../Napoleon';
import mocha from 'mocha';
import {expect} from 'chai';

describe('URLStructure',function() {
    describe('::isSegmentKey()', function() {
        it('positively flags keys', function() {
            expect(URLStructure.isSegmentKey('{keyName}')).to.equal(true);
        });

        it('negatively flags non-keys', function() {
            expect(URLStructure.isSegmentKey('keyName')).to.equal(false);
            expect(URLStructure.isSegmentKey('{keyName')).to.equal(false);
            expect(URLStructure.isSegmentKey('keyName}')).to.equal(false);
            expect(URLStructure.isSegmentKey('key{Name}')).to.equal(false);
        });
    });

    describe('::getSegmentKey()', function() {
        it('identifies the key name', function() {
            expect(URLStructure.getSegmentKey('{keyName}')).to.equal('keyName');
        });

        it('disregards non-keyed segments', function() {
            expect(URLStructure.getSegmentKey('keyName')).to.equal(null);
            expect(URLStructure.getSegmentKey('{keyName')).to.equal(null);
            expect(URLStructure.getSegmentKey('keyName}')).to.equal(null);
            expect(URLStructure.getSegmentKey('key{Name}')).to.equal(null);
        });
    });

    describe('::getPathname()', function() {
        let urlStructure;

        expect(URLStructure.getPathname('http://www.example.com/this/is/something')).to.equal('/this/is/something');

        expect(URLStructure.getPathname('https://www.example.com/this/is/something')).to.equal('/this/is/something');

        expect(URLStructure.getPathname('//www.example.com/this/is/something')).to.equal('/this/is/something');

        expect(URLStructure.getPathname('http://example.com/this/is/something')).to.equal('/this/is/something');

        expect(URLStructure.getPathname('http://www.example.com:80/this/is/something')).to.equal('/this/is/something');

        expect(URLStructure.getPathname('//www.example.com:80/this/is/something')).to.equal('/this/is/something');
    });

    describe('#constructor()', function() {
        it('identifies the path segments', function() {
            let url = '/this/is/{something}';
            let urlStructure = new URLStructure(url);
            expect(urlStructure).to.have.property('segments').to.deep.equal(['this', 'is', '{something}']);
        });

        it('ignores trailing slash', function() {
            let url = '/this/is/something/';
            let urlStructure = new URLStructure(url);
            expect(urlStructure).to.have.property('segments').to.deep.equal(['this', 'is', 'something']);

            url = '/this/is/something';
            urlStructure = new URLStructure(url);
            expect(urlStructure).to.have.property('segments').to.deep.equal(['this', 'is', 'something']);
        });

        it('parses the querystring', function() {
            let url = `/about?key=value&query=param&encoded=${encodeURIComponent('this is a test')}`;
            let urlStructure = new URLStructure(url);
            expect(urlStructure).to.have.property('querystring').to.deep.equal({
                key: 'value',
                query: 'param',
                encoded: 'this is a test'
            });
        });
    });

    describe('#getUrlForState()', function() {
        let urlStructure = new URLStructure('/about/{key}/test/{anotherKey}');
        it('injects path parameters', function() {
            expect(urlStructure.getUrlForState({
                key: 'value',
                anotherKey: 'anotherValue'
            })).to.equal('/about/value/test/anotherValue');
        });

        it('injects querystring parameters', function() {
            expect(urlStructure.getUrlForState({
                key: 'value',
                anotherKey: 'anotherValue',
                qkey: 'qvalue',
                qkey2: 'qvalue2'
            })).to.equal('/about/value/test/anotherValue?qkey=qvalue&qkey2=qvalue2');
        });
    });
});