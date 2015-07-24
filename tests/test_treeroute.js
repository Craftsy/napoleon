import {URLStructure, TreeRoute} from '../Napoleon';
import mocha from 'mocha';
import {expect} from 'chai';

let noop = function() {};

describe('TreeRoute', function() {
    describe('#addRoute', function() {
        it('should add a route at the root', function() {
            let treeroute;
            let urlStructure = new URLStructure('/');

            treeroute = new TreeRoute();
            treeroute.addRoute(noop, urlStructure);
            expect(treeroute.leaf).to.deep.equal({urlStructure, handler: noop});
            expect(treeroute.children).to.be.empty;
        });

        it('should add a route below the root', function() {
            let treeroute;
            let urlStructure = new URLStructure('/about');

            treeroute = new TreeRoute();
            treeroute.addRoute(noop, urlStructure);
            expect(treeroute.leaf).to.equal(null);
            expect(treeroute).to.have.deep.property('children.about').to.be.an.instanceof(TreeRoute);
            expect(treeroute).to.have.deep.property('children.about.children').to.be.empty;
            expect(treeroute).to.have.deep.property('children.about.leaf').to.deep.equal({urlStructure, handler: noop});
        });

        it('should add both a root and child route', function() {
            let treeroute;
            let rootUrlStructure = new URLStructure('/');
            let childUrlStructure = new URLStructure('/about');

            treeroute = new TreeRoute();
            treeroute.addRoute(noop, rootUrlStructure);
            treeroute.addRoute(noop, childUrlStructure);

            expect(treeroute.leaf).to.deep.equal({urlStructure: rootUrlStructure, handler: noop});
            expect(treeroute).to.have.deep.property('children.about').to.be.an.instanceof(TreeRoute);
            expect(treeroute).to.have.deep.property('children.about.children').to.be.empty;
            expect(treeroute).to.have.deep.property('children.about.leaf').to.deep.equal({urlStructure: childUrlStructure, handler: noop});
        });

        it('should distinguish between dynamic & static routes', function() {
            let treeroute = new TreeRoute();
            let urlStructure = new URLStructure('/about/{value}');
            treeroute.addRoute(noop, urlStructure);
            expect(treeroute).to.have.deep.property('children.about.children.?dynamic?.leaf').to.deep.equal({urlStructure, handler: noop});
        });
        it('should error on a duplicate static route', function() {
            let treeroute = new TreeRoute();

            treeroute.addRoute(noop, new URLStructure('/about'));
            expect(
                treeroute.addRoute.bind(treeroute, noop, new URLStructure('/about'))
            ).to.throw(Error);
        });

        it('should error on a duplicate dynamic route', function() {
            let treeroute = new TreeRoute();

            treeroute.addRoute(noop, new URLStructure('/about/{value}'));
            expect(
                treeroute.addRoute.bind(treeroute, noop, new URLStructure('/about/{otherValue}'))
            ).to.throw(Error);
        });

        it('should error on duplicate routes sharing a dynamic value', function() {
            let treeroute = new TreeRoute();

            treeroute.addRoute(noop, new URLStructure('/about/{value}/test'));
            expect(
                treeroute.addRoute.bind(treeroute, noop, new URLStructure('/about/{otherValue}/test'))
            ).to.throw(Error);
        });

        it('doesn\'t error when a static route and dynamic route co-exist', function() {
            let treeroute = new TreeRoute();

            treeroute.addRoute(noop, new URLStructure('/about/test'));
            expect(
                treeroute.addRoute.bind(treeroute, noop, new URLStructure('/about/{value}'))
            ).to.not.throw(Error);
        });

        it('puts blats in the correct place', function() {
            let treeroute = new TreeRoute();

            let urlStructure = new URLStructure('*');
            treeroute.addRoute(noop, urlStructure);
            expect(treeroute).to.have.deep.property('children.?blat?.leaf').to.deep.equal({urlStructure, handler: noop});
        });

        it('doesn\'t allow path segments after a blat', function(){
            let treeroute = new TreeRoute();

            expect(
                treeroute.addRoute.bind(treeroute, noop, new URLStructure('/*/about'))
            ).to.throw(Error);
        });
    });
});