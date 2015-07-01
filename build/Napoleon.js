define(["exports"],function(t){"use strict";function e(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function t(n){e(this,t),this.path=n,this.components=this.path.split("/").filter(function(t){return t.length>0})}return t.getComponentKey=function(t){var e=null;return"{"===t.charAt(0)&&"}"===t.charAt(t.length-1)&&(e=t.slice(1,-1)),e},t.prototype.applyState=function(e){for(var n=[],r=this.components.reduce(function(r,o){var u=t.getComponentKey(o);if(n.push(u),null!=u){var i=e[u];null!=i&&(r+="/"+i)}else r+="/"+o;return r},""),o=[],u=Object.keys(e),i=0;i<u.length;i++){var s=u[i];if(-1===n.indexOf(s)){var a=e[s];o.push(s+"="+encodeURIComponent(a))}}return o.length>0&&(r+="?"+o.join("&")),r},t}();t.URLStructure=n;var r=function(){function t(){e(this,t),this.urlStructure=null,this.staticChildren={},this.dynamicChildren={}}return t.prototype.addRoute=function(e){var r=void 0===arguments[1]?0:arguments[1],o=e.components[r];if(null==o){if(null!=this.urlStructure)throw new Error("Route "+e.path+" already mounted: "+this.urlStructure.path);this.urlStructure=e}else{var u=n.getComponentKey(o),i=null==u?this.staticChildren:this.dynamicChildren;i.hasOwnProperty(o)||(i[o]=new t),i[o].addRoute(e,r+1)}},t}(),o=function(){function t(){e(this,t),this.trees={GET:new r,POST:new r}}return t.prototype.mount=function(t,e){if("GET"!==t&&"POST"!==t)throw new Error("Route method must be either GET or POST");var r=new n(e);this.trees[t].addRoute(r),console.log(r.applyState({userId:614307}))},t}();t.Router=o;var u={};t["default"]=u});