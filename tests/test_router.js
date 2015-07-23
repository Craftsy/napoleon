import {Router} from '../Napoleon';
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
            let returnVal = router.mount('GET', '/', noop);
            expect(router).to.equal(returnVal);
        });
        
        it('should mount a route on the correct tree', function() {
            let router;

            router = new Router();
            router.mount('GET', '/', noop);
            expect(router.trees).to.have.property('get');
            expect(router.trees).to.not.have.property('post');

            router = new Router();
            router.mount('POST', '/', noop);
            expect(router.trees).to.not.have.property('get');
            expect(router.trees).to.have.property('post');
        });
    });

    describe('#matchRoute()', function() {
        // @TODO move router creation into the individual tests
        let router = new Router();
        router.mount('GET', '/', noop);
        router.mount('GET', '/about', noop);
        router.mount('GET', '/about/{value}', noop);
        router.mount('POST', '/about/{value}/test', noop);
        router.mount('POST', '/about/{value}/anotherTest/{anotherValue}', noop);

        it('should match at top-level', function() {
            // @TODO test the return type explicity. not "not null"
            expect(router.matchRoute('GET', '/')).to.not.equal(null);
        });

        it('should match the HTTP method', function() {
            expect(router.matchRoute('POST', '/')).to.equal(null);
        });

        it('should match nested routes', function() {
            expect(router.matchRoute('GET', '/about')).to.not.equal(null);
        });

        it('should be trailing-slash insensitive', function() {
            let structure1 = router.matchRoute('GET', '/about');
            let structure2 = router.matchRoute('GET', '/about/');
            expect(structure1).to.equal(structure2);
        });

        it('should match parameterized routes', function() {
            expect(router.matchRoute('GET', '/about/anything')).to.not.equal(null);
        });

        it('should match parameterized routes\' children', function() {
            expect(router.matchRoute('POST', '/about/anything/test')).to.not.equal(null);
        });

        it('should require all path parameters to exist', function() {
            expect(router.matchRoute('POST', '/about/anything/anotherTest')).to.equal(null);
            expect(router.matchRoute('POST', '/about/anything/anotherTest/')).to.equal(null);
            expect(router.matchRoute('POST', '/about/anything/anotherTest/anotherValue')).to.not.equal(null);
        });

        // @TODO this should be first or second of these tests
        it('should return null when no matches', function() {
            expect(router.matchRoute('GET', '/doesnt/exist')).to.equal(null);
        });

        it('should ignore querystrings', function() {
            expect(router.matchRoute('GET', '/about?this=is&a=test')).to.not.equal(null);
        });
    });

    describe('#route()', function() {
        // @TODO add & document & test fall throughs / catch-all

        it('should fire the handler', function(done){
            let router = new Router();
            router.mount('GET', '/', ()=>done());
            router.route('GET', '/');
        });

        // @TODO it shouldn't pass the url to the handler
        it('should pass the matching url to the handler', function(done){
            let router = new Router();
            let routeUrl = '/about';
            router.mount('GET', routeUrl, function(url) {
                expect(routeUrl).to.equal(url);
                done();
            });
            router.route('GET', routeUrl);
        });

        it('should pass route parameters to the handler', function(done){
            let router = new Router();
            router.mount('GET', '/about/{value}/{anotherValue}', function(url, parameters) {
                // @TODO deepEquals
                expect(parameters).to.have.property('value').to.equal('ABC');
                expect(parameters).to.have.property('anotherValue').to.equal('012');
                done();
            });
            router.route('GET', '/about/ABC/012');
        });

        it('should pass querystring parameters to the handler', function(done){
            let router = new Router();
            router.mount('GET', '/about/{value}', function(url, parameters) {
                // @TODO deepEquals
                expect(parameters).to.have.property('value').to.equal('ABC');
                expect(parameters).to.have.property('anotherValue').to.equal('XYZ');
                done();
            });
            router.route('GET', '/about/ABC?anotherValue=XYZ');
        });

        it('should not override path parameters with querystring parameters', function(done){
            let router = new Router();
            router.mount('GET', '/about/{value}', function(url, parameters) {
                // @TODO deepEquals
                expect(parameters).to.have.property('value').to.equal('ABC');
                done();
            });
            router.route('GET', '/about/ABC?value=XYZ');
        });

        // @TODO test that all parameters come back as strings - explicitly test numbers and booleans
    });
});