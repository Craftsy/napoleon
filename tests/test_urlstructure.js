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
        it('should return the full relative URL path & querystring', function() {
            let urlStructure;

            expect(URLStructure.getPathname('http://www.example.com/this/is/something')).to.equal('/this/is/something');

            expect(URLStructure.getPathname('https://www.example.com/this/is/something')).to.equal('/this/is/something');

            expect(URLStructure.getPathname('//www.example.com/this/is/something')).to.equal('/this/is/something');

            expect(URLStructure.getPathname('http://example.com/this/is/something')).to.equal('/this/is/something');

            expect(URLStructure.getPathname('http://www.example.com:80/this/is/something')).to.equal('/this/is/something');

            expect(URLStructure.getPathname('//www.example.com:80/this/is/something')).to.equal('/this/is/something');

            expect(URLStructure.getPathname('//www.example.com:80/this/is/something?query=string')).to.equal('/this/is/something?query=string');

            expect(URLStructure.getPathname('//www.example.com:80/this/is/something?url=https://example.com/path')).to.equal('/this/is/something?url=https://example.com/path');

            expect(URLStructure.getPathname('/a/path')).to.equal('/a/path');

            expect(URLStructure.getPathname('/a/path?with=querystring')).to.equal('/a/path?with=querystring');
            
            expect(URLStructure.getPathname('/a/path?url=https://example.com/path')).to.equal('/a/path?url=https://example.com/path');
        });
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
        let topLEvelUrlStructure = new URLStructure('/');
        let urlStructure = new URLStructure('/about/{key}/test/{anotherKey}');

        it('builds a top-level url correctly', function() {
            expect(topLEvelUrlStructure.getUrlForState({})).to.equal('/');
        });

        it('injects path parameters', function() {
            expect(urlStructure.getUrlForState({
                key: 'value',
                anotherKey: 'anotherValue'
            })).to.equal('/about/value/test/anotherValue');
        });

        it('ignores unset path parameters', function() {
            expect(urlStructure.getUrlForState({
                anotherKey: 'anotherValue'
            })).to.equal('/about/test/anotherValue');
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

    describe('#extractParameters()', function() {
        it('extracts named parameters', function() {
            let urlStructure = new URLStructure('/about/{key1}/{key2}');
            expect(urlStructure.extractParameters('/about/value1/value2')).to.deep.equal({
                key1: 'value1',
                key2: 'value2'
            });
        });

        it('extracts query parameters', function() {
            let urlStructure = new URLStructure('/about/{key1}');
            expect(urlStructure.extractParameters('/about/value1?key2=value2')).to.deep.equal({
                key1: 'value1',
                key2: 'value2'
            });
        });

        it('extracts blat parameter', function() {
            let urlStructure = new URLStructure('/about/{key1}/*');
            expect(urlStructure.extractParameters('/about/value1/value2/value3?key2=value4')).to.deep.equal({
                key1: 'value1',
                key2: 'value4',
                blat: 'value2/value3'
            });
        });
    });

    describe('#toString()', function() {
        it('treats the url as absolute', function() {
            expect(new URLStructure('').toString()).to.equal('/');
            expect(new URLStructure('about').toString()).to.equal('/about');
        });

        it('adds all path segments', function() {
            expect(new URLStructure('/about/{name}').toString()).to.equal('/about/{name}');
        });

        it('excludes trailing slashes', function() {
            expect(new URLStructure('/about/').toString()).to.equal('/about');
        });

        it('includes a querystring', function() {
            expect(new URLStructure('/about?key=value').toString()).to.equal('/about?key=value');
            expect(new URLStructure('/about?key=the%20value').toString()).to.equal('/about?key=the%20value');
        });
    });
});
