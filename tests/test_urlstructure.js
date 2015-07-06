import {URLStructure} from '../Napoleon';
import mocha from 'mocha';
import {expect} from 'chai';

describe('URLStructure',function() {
    describe('::getComponentKey()', function(){
        it('identifies the key name', function(){
            expect(URLStructure.getComponentKey('{keyName}')).to.equal('keyName');
        });

        it('disregards non-keyed components', function(){
            expect(URLStructure.getComponentKey('keyName')).to.equal(null);
            expect(URLStructure.getComponentKey('{keyName')).to.equal(null);
            expect(URLStructure.getComponentKey('keyName}')).to.equal(null);
        });
    });

    describe('#constructor()', function(){
        it('sets the url', function(){
            let url = '/this/is/something';
            let urlStructure = new URLStructure(url);
            expect(urlStructure).to.have.property('url').to.equal(url);
        });

        it('removes host/protocol/port', function(){
            let urlStructure;

            urlStructure = new URLStructure('http://www.example.com/this/is/something');
            expect(urlStructure).to.have.property('url').to.equal('/this/is/something');

            urlStructure = new URLStructure('https://www.example.com/this/is/something');
            expect(urlStructure).to.have.property('url').to.equal('/this/is/something');

            urlStructure = new URLStructure('//www.example.com/this/is/something');
            expect(urlStructure).to.have.property('url').to.equal('/this/is/something');

            urlStructure = new URLStructure('http://example.com/this/is/something');
            expect(urlStructure).to.have.property('url').to.equal('/this/is/something');

            urlStructure = new URLStructure('http://www.example.com:80/this/is/something');
            expect(urlStructure).to.have.property('url').to.equal('/this/is/something');

            urlStructure = new URLStructure('//www.example.com:80/this/is/something');
            expect(urlStructure).to.have.property('url').to.equal('/this/is/something');
        });

        it('identifies the path components', function(){
            let url = '/this/is/{something}';
            let urlStructure = new URLStructure(url);
            expect(urlStructure).to.have.property('components').with.length(3);
            expect(urlStructure.components[0]).to.equal('this');
            expect(urlStructure.components[1]).to.equal('is');
            expect(urlStructure.components[2]).to.equal('{something}');
        });

        it('ignores trailing slash', function(){
            let url = '/this/is/something/';
            let urlStructure = new URLStructure(url);
            expect(urlStructure).to.have.property('components').with.length(3);
        });

        it('parses the querystring', function(){
            let url = `/about?key=value&query=param&encoded=${encodeURIComponent('this is a test')}`;
            let urlStructure = new URLStructure(url);
            expect(urlStructure).to.have.property('querystring').to.not.be.empty;
            expect(urlStructure.querystring).to.have.property('key').to.equal('value');
            expect(urlStructure.querystring).to.have.property('query').to.equal('param');
            expect(urlStructure.querystring).to.have.property('encoded').to.equal('this is a test');
        });
    });

    describe('#applyState()', function(){
        let urlStructure = new URLStructure('/about/{key}/test/{anotherKey}');
        it('injects path parameters', function(){
            expect(urlStructure.applyState({
                key: 'value',
                anotherKey: 'anotherValue'
            })).to.equal('/about/value/test/anotherValue');
        });

        it('injects querystring parameters', function(){
            expect(urlStructure.applyState({
                key: 'value',
                anotherKey: 'anotherValue',
                qkey: 'qvalue',
                qkey2: 'qvalue2'
            })).to.equal('/about/value/test/anotherValue?qkey=qvalue&qkey2=qvalue2');
        });
    });
});