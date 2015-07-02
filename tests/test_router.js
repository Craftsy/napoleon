import {Router} from '../Napoleon';
import mocha from 'mocha';
import {expect} from 'chai';

let noop = function(){};

describe('Router', function(){
    describe('#constructor()', function(){
        it('should trees property with GET and POST', function(){
            let router = new Router();
            expect(router).to.have.property('trees');

            expect(router.trees).to.have.property('GET');
            expect(router.trees).to.have.property('POST');
        });
    });

    describe('#mount()', function(){
        it('should mount a route on the correct tree', function(){
            let router;

            router = new Router();
            router.mount('GET', '/', noop);
            expect(router.trees.GET.leaf).to.not.equal(null);
            expect(router.trees.POST.leaf).to.equal(null);

            router = new Router();
            router.mount('POST', '/', noop);
            expect(router.trees.GET.leaf).to.equal(null);
            expect(router.trees.POST.leaf).to.not.equal(null);
        });

        it('should mount a route at the correct location', function(){
            let router = new Router();
            router.mount('GET', '/about', noop);
            expect(router.trees.GET.leaf).to.equal(null);
            expect(router.trees.GET.children).to.have.property('about');
            expect(router.trees.GET.children.about.leaf).to.not.equal(null);
        });

        it('should treat dynamic routes differently', function(){
            let router = new Router();
            router.mount('GET', '/about/{value}', noop);
            expect(router.trees.GET.children.about.children).to.have.property('?dynamic?');
            expect(router.trees.GET.children.about.children).to.have.property('?dynamic?').with.property('leaf').to.not.equal(null);
        });

        it('should error on duplicate routes', function(){
            let router = new Router();

            router.mount('GET', '/about');
            expect(
                router.mount.bind(router, 'GET', '/about')
            ).to.throw(Error);

            router.mount('GET', '/about/{value}');
            expect(
                router.mount.bind(router, 'GET', '/about/{otherValue}')
            ).to.throw(Error);

            router.mount('GET', '/about/{value}/test');
            expect(
                router.mount.bind(router, 'GET', '/about/{otherValue}/test')
            ).to.throw(Error);
        });
    });

    describe('#matchRoute()', function(){
        let router = new Router();
        router.mount('GET', '/', noop);
        router.mount('GET', '/about', noop);
        router.mount('GET', '/about/{value}', noop);
        router.mount('POST', '/about/{value}/test', noop);
        router.mount('POST', '/about/{value}/anotherTest/{anotherValue}', noop);

        it('should match at top-level', function(){
            expect(router.matchRoute('GET', '/')).to.not.equal(null);
        });

        it('should match the HTTP method', function(){
            expect(router.matchRoute('POST', '/')).to.equal(null);
        });

        it('should match child routes', function(){
            expect(router.matchRoute('GET', '/about')).to.not.equal(null);
        });

        it('should ignore trailing slashes', function(){
            let structure1 = router.matchRoute('GET', '/about');
            let structure2 = router.matchRoute('GET', '/about/');
            expect(structure1).to.equal(structure2);
        });

        it('should match parameterized routes', function(){
            expect(router.matchRoute('GET', '/about/anything')).to.not.equal(null);
        });

        it('should match parameterized routes\' children', function(){
            expect(router.matchRoute('POST', '/about/anything/test')).to.not.equal(null);
        });

        it('should require all parameters to exist', function(){
            expect(router.matchRoute('POST', '/about/anything/anotherTest')).to.equal(null);
            expect(router.matchRoute('POST', '/about/anything/anotherTest/')).to.equal(null);
            expect(router.matchRoute('POST', '/about/anything/anotherTest/anotherValue')).to.not.equal(null);
        });

        it('should return null when no matches', function(){
            expect(router.matchRoute('GET', '/doesnt/exist')).to.equal(null);
        });

        it('should not care about querystrings', function(){
            expect(router.matchRoute('GET', '/about?this=is&a=test')).to.not.equal(null);
        });
    });

    describe('#route()', function(){
        it('should fire the handler', function(done){
            let router = new Router();
            router.mount('GET', '/', ()=>done());
            router.route('GET', '/');
        });

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
                expect(parameters).to.have.property('value').to.equal('ABC');
                expect(parameters).to.have.property('anotherValue').to.equal('012');
                done();
            });
            router.route('GET', '/about/ABC/012');
        });

        it('should pass querystring parameters to the handler', function(done){
            let router = new Router();
            router.mount('GET', '/about/{value}', function(url, parameters) {
                expect(parameters).to.have.property('value').to.equal('ABC');
                expect(parameters).to.have.property('anotherValue').to.equal('XYZ');
                done();
            });
            router.route('GET', '/about/ABC?anotherValue=XYZ');
        });

        it('should not override path parameters with querystring parameters', function(done){
            let router = new Router();
            router.mount('GET', '/about/{value}', function(url, parameters) {
                expect(parameters).to.have.property('value').to.equal('ABC');
                done();
            });
            router.route('GET', '/about/ABC?value=XYZ');
        });
    });
});