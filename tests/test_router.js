import {Router, URLStructure} from '../Napoleon';
import mocha from 'mocha';
import {expect} from 'chai';

let noop = function() {};

describe('Router', function() {
    describe('#constructor()', function() {
        it('should have an empty tree map', function() {
            let router = new Router();
            expect(router).to.have.property('trees').to.be.empty;
        });
    });

    describe('#mount()', function() {
        it('should return the router instance for chaining', function() {
            let router = new Router();
            let returnVal = router.mount({method: 'GET', url: '/', handler: noop});
            expect(router).to.equal(returnVal);
        });

        it('should mount a route on the correct tree', function() {
            let router;

            router = new Router();
            router.mount({method: 'GET', url: '/', handler: noop});
            expect(router.trees).to.have.property('get');
            expect(router.trees).to.not.have.property('post');

            router = new Router();
            router.mount({method: 'POST', url: '/', handler: noop});
            expect(router.trees).to.not.have.property('get');
            expect(router.trees).to.have.property('post');
        });
    });

    describe('#matchRoute()', function() {
        it('should return null when no matches', function() {
            let router = new Router();
            expect(router.matchRoute('GET', '/doesnt/exist')).to.equal(null);
        });

        it('should match at top-level', function() {
            let router = new Router();
            router.mount({method: 'GET', url: '/', handler: noop});

            let returnValue = router.matchRoute('GET', '/');
            expect(returnValue).to.have.property('urlStructure').to.be.an.instanceof(URLStructure);
            expect(returnValue).to.have.property('handler').to.equal(noop);
        });

        it('should match the HTTP method', function() {
            let router = new Router();
            router.mount({method: 'GET', url: '/', handler: noop});

            expect(router.matchRoute('POST', '/')).to.equal(null);
        });

        it('should match nested routes', function() {
            let router = new Router();
            router.mount({method: 'GET', url: '/about', handler: noop});

            let returnValue = router.matchRoute('GET', '/about');
            expect(returnValue).to.have.property('urlStructure').to.be.an.instanceof(URLStructure);
            expect(returnValue).to.have.property('handler').to.equal(noop);
        });

        it('should be trailing-slash insensitive', function() {
            let router = new Router();
            router.mount({method: 'GET', url: '/about', handler: noop});

            let structure1 = router.matchRoute('GET', '/about');
            let structure2 = router.matchRoute('GET', '/about/');
            expect(structure1).to.equal(structure2);
        });

        it('should match parameterized routes', function() {
            let router = new Router();
            router.mount({method: 'GET', url: '/about/{value}', handler: noop});

            let returnValue = router.matchRoute('GET', '/about/anything');
            expect(returnValue).to.have.property('urlStructure').to.be.an.instanceof(URLStructure);
            expect(returnValue).to.have.property('handler').to.equal(noop);
        });

        it('should match parameterized routes\' children', function() {
            let router = new Router();
            router.mount({method: 'POST', url: '/about/{value}/test', handler: noop});

            let returnValue = router.matchRoute('POST', '/about/anything/test');
            expect(returnValue).to.have.property('urlStructure').to.be.an.instanceof(URLStructure);
            expect(returnValue).to.have.property('handler').to.equal(noop);
        });

        it('should require all path parameters to exist', function() {
            let router = new Router();
            router.mount({method: 'POST', url: '/about/{value}/anotherTest/{anotherValue}', handler: noop});

            expect(router.matchRoute('POST', '/about/anything/anotherTest')).to.equal(null);
            expect(router.matchRoute('POST', '/about/anything/anotherTest/')).to.equal(null);

            let returnValue = router.matchRoute('POST', '/about/anything/anotherTest/anotherValue');
            expect(returnValue).to.have.property('urlStructure').to.be.an.instanceof(URLStructure);
            expect(returnValue).to.have.property('handler').to.equal(noop);
        });

        it('should match more specific routes first', function() {
            let router = new Router();
            let noop2 = ()=>{};

            router.mount({method: 'GET', url: '/about/{value}', handler: noop});
            router.mount({method: 'GET', url: '/about/test', handler: noop2});

            let returnValue = router.matchRoute('GET', '/about/test');
            expect(returnValue).to.have.property('urlStructure').to.be.an.instanceof(URLStructure);
            expect(returnValue).to.have.property('handler').to.equal(noop2);
        });

        it('should match blats', function() {
            let router = new Router();
            router.mount({method: 'GET', url: '*', handler: noop});
            let returnValue = router.matchRoute('GET', '/about');
            expect(returnValue).to.have.property('urlStructure').to.be.an.instanceof(URLStructure);
            expect(returnValue).to.have.property('handler').to.equal(noop);

            router = new Router();
            router.mount({method: 'GET', url: '*', handler: noop});
            returnValue = router.matchRoute('GET', '/about/test');
            expect(returnValue).to.have.property('urlStructure').to.be.an.instanceof(URLStructure);
            expect(returnValue).to.have.property('handler').to.equal(noop);
        });

        it('should ignore querystrings', function() {
            let router = new Router();
            router.mount({method: 'GET', url: '/about', handler: noop});

            let returnValue = router.matchRoute('GET', '/about?this=is&a=test');
            expect(returnValue).to.have.property('urlStructure').to.be.an.instanceof(URLStructure);
            expect(returnValue).to.have.property('handler').to.equal(noop);
        });
    });

    describe('#route()', function() {
        it('should fire the handler', function(done){
            let router = new Router();
            router.mount({method: 'GET', url: '/', handler: ()=>done()});
            router.route('GET', '/');
        });

        it('should pass route parameters to the handler', function(done){
            let router = new Router();
            router.mount({method: 'GET', url: '/about/{value}/{anotherValue}', handler: function(parameters) {
                expect(parameters).to.deep.equal({
                    value: 'ABC',
                    anotherValue: '012'
                });
                done();
            }});
            router.route('GET', '/about/ABC/012');
        });

        it('should pass querystring parameters to the handler', function(done){
            let router = new Router();
            router.mount({method: 'GET', url: '/about/{value}', handler: function(parameters) {
                expect(parameters).to.deep.equal({
                    value: 'ABC',
                    anotherValue: 'XYZ'
                });
                done();
            }});
            router.route('GET', '/about/ABC?anotherValue=XYZ');
        });

        it('should not override path parameters with querystring parameters', function(done){
            let router = new Router();
            router.mount({method: 'GET', url: '/about/{value}', handler: function(parameters) {
                expect(parameters).to.deep.equal({
                    value: 'ABC'
                });
                done();
            }});
            router.route('GET', '/about/ABC?value=XYZ');
        });

        it('should collect blat value', function(done){
            let router = new Router();
            router.mount({method: 'GET', url: '/about/{key}/*', handler: function(parameters) {
                expect(parameters).to.deep.equal({
                    key: 'value1',
                    blat: 'value2/value3'
                });
                done();
            }});
            router.route('GET', '/about/value1/value2/value3');
        });

        it('should set all parameters as strings', function(done) {
            let router = new Router();
            router.mount({method: 'GET', url: '/{a}/{b}', handler: function(parameters) {
                expect(parameters).to.deep.equal({
                    a: '123',
                    b: 'true',
                    c: '890',
                    d: 'false'
                });
                done();
            }});
            router.route('GET', '/123/true?c=890&d=false');
        });

        it('should return the route\'s parameters', function() {
            let router = new Router();
            router.mount({url: '/test/{key}', handler: function() {}});

            let parameters = router.route('GET', '/test/value?query=string');
            expect(parameters).to.deep.equal({
                key: 'value',
                query: 'string'
            });
        });

        it('should return `null` parameters when no matching route', function() {
            let router = new Router();
            router.mount({url: '/test/{key}', handler: function() {}});

            let parameters = router.route('GET', '/test2/value?query=string');
            expect(parameters).to.be.null;
        });
    });
});
