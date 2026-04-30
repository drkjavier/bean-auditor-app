import * as __parcelExternal0 from "@babel/runtime/helpers/interopRequireDefault";
import * as __parcelExternal1 from "react";
import * as __parcelExternal2 from "react-dom/client";
import * as __parcelExternal3 from "react/jsx-runtime";
import * as __parcelExternal4 from "@babel/runtime/helpers/asyncToGenerator";
import * as __parcelExternal5 from "react-native";
import * as __parcelExternal6 from "react-native-paper";
import * as __parcelExternal7 from "@react-navigation/native";
import * as __parcelExternal8 from "@react-navigation/native-stack";
import * as __parcelExternal9 from "react-hook-form";
import * as __parcelExternal10 from "@tanstack/react-query";
import * as __parcelExternal11 from "axios";
import * as __parcelExternal12 from "zustand";
// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (
  modules,
  entry,
  mainEntry,
  parcelRequireName,
  externals,
  distDir,
  publicUrl,
  devServer
) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var importMap = previousRequire.i || {};
  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        if (externals[name]) {
          return externals[name];
        }
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        globalObject
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      if (res === false) {
        return {};
      }
      // Synthesize a module to follow re-exports.
      if (Array.isArray(res)) {
        var m = {__esModule: true};
        res.forEach(function (v) {
          var key = v[0];
          var id = v[1];
          var exp = v[2] || v[0];
          var x = newRequire(id);
          if (key === '*') {
            Object.keys(x).forEach(function (key) {
              if (
                key === 'default' ||
                key === '__esModule' ||
                Object.prototype.hasOwnProperty.call(m, key)
              ) {
                return;
              }

              Object.defineProperty(m, key, {
                enumerable: true,
                get: function () {
                  return x[key];
                },
              });
            });
          } else if (exp === '*') {
            Object.defineProperty(m, key, {
              enumerable: true,
              value: x,
            });
          } else {
            Object.defineProperty(m, key, {
              enumerable: true,
              get: function () {
                if (exp === 'default') {
                  return x.__esModule ? x.default : x;
                }
                return x[exp];
              },
            });
          }
        });
        return m;
      }
      return newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.require = nodeRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.distDir = distDir;
  newRequire.publicUrl = publicUrl;
  newRequire.devServer = devServer;
  newRequire.i = importMap;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  // Only insert newRequire.load when it is actually used.
  // The code in this file is linted against ES5, so dynamic import is not allowed.
  // INSERT_LOAD_HERE

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });
    }
  }
})({"eyYlO":[function(require,module,exports,__globalThis) {
var HMR_HOST = null;
var HMR_PORT = 3000;
var HMR_SERVER_PORT = 3000;
var HMR_SECURE = false;
var HMR_ENV_HASH = "1e123945dea001fa";
var HMR_USE_SSE = false;
module.bundle.HMR_BUNDLE_ID = "3543b2c4ced9d258";
"use strict";
/* global HMR_HOST, HMR_PORT, HMR_SERVER_PORT, HMR_ENV_HASH, HMR_SECURE, HMR_USE_SSE, chrome, browser, __parcel__import__, __parcel__importScripts__, ServiceWorkerGlobalScope */ /*::
import type {
  HMRAsset,
  HMRMessage,
} from '@parcel/reporter-dev-server/src/HMRServer.js';
interface ParcelRequire {
  (string): mixed;
  cache: {|[string]: ParcelModule|};
  hotData: {|[string]: mixed|};
  Module: any;
  parent: ?ParcelRequire;
  isParcelRequire: true;
  modules: {|[string]: [Function, {|[string]: string|}]|};
  HMR_BUNDLE_ID: string;
  root: ParcelRequire;
}
interface ParcelModule {
  hot: {|
    data: mixed,
    accept(cb: (Function) => void): void,
    dispose(cb: (mixed) => void): void,
    // accept(deps: Array<string> | string, cb: (Function) => void): void,
    // decline(): void,
    _acceptCallbacks: Array<(Function) => void>,
    _disposeCallbacks: Array<(mixed) => void>,
  |};
}
interface ExtensionContext {
  runtime: {|
    reload(): void,
    getURL(url: string): string;
    getManifest(): {manifest_version: number, ...};
  |};
}
declare var module: {bundle: ParcelRequire, ...};
declare var HMR_HOST: string;
declare var HMR_PORT: string;
declare var HMR_SERVER_PORT: string;
declare var HMR_ENV_HASH: string;
declare var HMR_SECURE: boolean;
declare var HMR_USE_SSE: boolean;
declare var chrome: ExtensionContext;
declare var browser: ExtensionContext;
declare var __parcel__import__: (string) => Promise<void>;
declare var __parcel__importScripts__: (string) => Promise<void>;
declare var globalThis: typeof self;
declare var ServiceWorkerGlobalScope: Object;
*/ var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;
function Module(moduleName) {
    OldModule.call(this, moduleName);
    this.hot = {
        data: module.bundle.hotData[moduleName],
        _acceptCallbacks: [],
        _disposeCallbacks: [],
        accept: function(fn) {
            this._acceptCallbacks.push(fn || function() {});
        },
        dispose: function(fn) {
            this._disposeCallbacks.push(fn);
        }
    };
    module.bundle.hotData[moduleName] = undefined;
}
module.bundle.Module = Module;
module.bundle.hotData = {};
var checkedAssets /*: {|[string]: boolean|} */ , disposedAssets /*: {|[string]: boolean|} */ , assetsToDispose /*: Array<[ParcelRequire, string]> */ , assetsToAccept /*: Array<[ParcelRequire, string]> */ , bundleNotFound = false;
function getHostname() {
    return HMR_HOST || (typeof location !== 'undefined' && location.protocol.indexOf('http') === 0 ? location.hostname : 'localhost');
}
function getPort() {
    return HMR_PORT || (typeof location !== 'undefined' ? location.port : HMR_SERVER_PORT);
}
// eslint-disable-next-line no-redeclare
let WebSocket = globalThis.WebSocket;
if (!WebSocket && typeof module.bundle.root === 'function') try {
    // eslint-disable-next-line no-global-assign
    WebSocket = module.bundle.root('ws');
} catch  {
// ignore.
}
var hostname = getHostname();
var port = getPort();
var protocol = HMR_SECURE || typeof location !== 'undefined' && location.protocol === 'https:' && ![
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
].includes(hostname) ? 'wss' : 'ws';
// eslint-disable-next-line no-redeclare
var parent = module.bundle.parent;
if (!parent || !parent.isParcelRequire) {
    // Web extension context
    var extCtx = typeof browser === 'undefined' ? typeof chrome === 'undefined' ? null : chrome : browser;
    // Safari doesn't support sourceURL in error stacks.
    // eval may also be disabled via CSP, so do a quick check.
    var supportsSourceURL = false;
    try {
        (0, eval)('throw new Error("test"); //# sourceURL=test.js');
    } catch (err) {
        supportsSourceURL = err.stack.includes('test.js');
    }
    var ws;
    if (HMR_USE_SSE) ws = new EventSource('/__parcel_hmr');
    else try {
        // If we're running in the dev server's node runner, listen for messages on the parent port.
        let { workerData, parentPort } = module.bundle.root('node:worker_threads') /*: any*/ ;
        if (workerData !== null && workerData !== void 0 && workerData.__parcel) {
            parentPort.on('message', async (message)=>{
                try {
                    await handleMessage(message);
                    parentPort.postMessage('updated');
                } catch  {
                    parentPort.postMessage('restart');
                }
            });
            // After the bundle has finished running, notify the dev server that the HMR update is complete.
            queueMicrotask(()=>parentPort.postMessage('ready'));
        }
    } catch  {
        if (typeof WebSocket !== 'undefined') try {
            ws = new WebSocket(protocol + '://' + hostname + (port ? ':' + port : '') + '/');
        } catch (err) {
            // Ignore cloudflare workers error.
            if (err.message && !err.message.includes('Disallowed operation called within global scope')) console.error(err.message);
        }
    }
    if (ws) {
        // $FlowFixMe
        ws.onmessage = async function(event /*: {data: string, ...} */ ) {
            var data /*: HMRMessage */  = JSON.parse(event.data);
            await handleMessage(data);
        };
        if (ws instanceof WebSocket) {
            ws.onerror = function(e) {
                if (e.message) console.error(e.message);
            };
            ws.onclose = function() {
                console.warn("[parcel] \uD83D\uDEA8 Connection to the HMR server was lost");
            };
        }
    }
}
async function handleMessage(data /*: HMRMessage */ ) {
    checkedAssets = {} /*: {|[string]: boolean|} */ ;
    disposedAssets = {} /*: {|[string]: boolean|} */ ;
    assetsToAccept = [];
    assetsToDispose = [];
    bundleNotFound = false;
    if (data.type === 'reload') fullReload();
    else if (data.type === 'update') {
        // Remove error overlay if there is one
        if (typeof document !== 'undefined') removeErrorOverlay();
        let assets = data.assets;
        // Handle HMR Update
        let handled = assets.every((asset)=>{
            return asset.type === 'css' || asset.type === 'js' && hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle);
        });
        // Dispatch a custom event in case a bundle was not found. This might mean
        // an asset on the server changed and we should reload the page. This event
        // gives the client an opportunity to refresh without losing state
        // (e.g. via React Server Components). If e.preventDefault() is not called,
        // we will trigger a full page reload.
        if (handled && bundleNotFound && assets.some((a)=>a.envHash !== HMR_ENV_HASH) && typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') handled = !window.dispatchEvent(new CustomEvent('parcelhmrreload', {
            cancelable: true
        }));
        if (handled) {
            console.clear();
            // Dispatch custom event so other runtimes (e.g React Refresh) are aware.
            if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') window.dispatchEvent(new CustomEvent('parcelhmraccept'));
            await hmrApplyUpdates(assets);
            hmrDisposeQueue();
            // Run accept callbacks. This will also re-execute other disposed assets in topological order.
            let processedAssets = {};
            for(let i = 0; i < assetsToAccept.length; i++){
                let id = assetsToAccept[i][1];
                if (!processedAssets[id]) {
                    hmrAccept(assetsToAccept[i][0], id);
                    processedAssets[id] = true;
                }
            }
        } else fullReload();
    }
    if (data.type === 'error') {
        // Log parcel errors to console
        for (let ansiDiagnostic of data.diagnostics.ansi){
            let stack = ansiDiagnostic.codeframe ? ansiDiagnostic.codeframe : ansiDiagnostic.stack;
            console.error("\uD83D\uDEA8 [parcel]: " + ansiDiagnostic.message + '\n' + stack + '\n\n' + ansiDiagnostic.hints.join('\n'));
        }
        if (typeof document !== 'undefined') {
            // Render the fancy html overlay
            removeErrorOverlay();
            var overlay = createErrorOverlay(data.diagnostics.html);
            // $FlowFixMe
            document.body.appendChild(overlay);
        }
    }
}
function removeErrorOverlay() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
        overlay.remove();
        console.log("[parcel] \u2728 Error resolved");
    }
}
function createErrorOverlay(diagnostics) {
    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    let errorHTML = '<div style="background: black; opacity: 0.85; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; font-family: Menlo, Consolas, monospace; z-index: 9999;">';
    for (let diagnostic of diagnostics){
        let stack = diagnostic.frames.length ? diagnostic.frames.reduce((p, frame)=>{
            return `${p}
<a href="${protocol === 'wss' ? 'https' : 'http'}://${hostname}:${port}/__parcel_launch_editor?file=${encodeURIComponent(frame.location)}" style="text-decoration: underline; color: #888" onclick="fetch(this.href); return false">${frame.location}</a>
${frame.code}`;
        }, '') : diagnostic.stack;
        errorHTML += `
      <div>
        <div style="font-size: 18px; font-weight: bold; margin-top: 20px;">
          \u{1F6A8} ${diagnostic.message}
        </div>
        <pre>${stack}</pre>
        <div>
          ${diagnostic.hints.map((hint)=>"<div>\uD83D\uDCA1 " + hint + '</div>').join('')}
        </div>
        ${diagnostic.documentation ? `<div>\u{1F4DD} <a style="color: violet" href="${diagnostic.documentation}" target="_blank">Learn more</a></div>` : ''}
      </div>
    `;
    }
    errorHTML += '</div>';
    overlay.innerHTML = errorHTML;
    return overlay;
}
function fullReload() {
    if (typeof location !== 'undefined' && 'reload' in location) location.reload();
    else if (typeof extCtx !== 'undefined' && extCtx && extCtx.runtime && extCtx.runtime.reload) extCtx.runtime.reload();
    else try {
        let { workerData, parentPort } = module.bundle.root('node:worker_threads') /*: any*/ ;
        if (workerData !== null && workerData !== void 0 && workerData.__parcel) parentPort.postMessage('restart');
    } catch (err) {
        console.error("[parcel] \u26A0\uFE0F An HMR update was not accepted. Please restart the process.");
    }
}
function getParents(bundle, id) /*: Array<[ParcelRequire, string]> */ {
    var modules = bundle.modules;
    if (!modules) return [];
    var parents = [];
    var k, d, dep;
    for(k in modules)for(d in modules[k][1]){
        dep = modules[k][1][d];
        if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) parents.push([
            bundle,
            k
        ]);
    }
    if (bundle.parent) parents = parents.concat(getParents(bundle.parent, id));
    return parents;
}
function updateLink(link) {
    var href = link.getAttribute('href');
    if (!href) return;
    var newLink = link.cloneNode();
    newLink.onload = function() {
        if (link.parentNode !== null) // $FlowFixMe
        link.parentNode.removeChild(link);
    };
    newLink.setAttribute('href', // $FlowFixMe
    href.split('?')[0] + '?' + Date.now());
    // $FlowFixMe
    link.parentNode.insertBefore(newLink, link.nextSibling);
}
var cssTimeout = null;
function reloadCSS() {
    if (cssTimeout || typeof document === 'undefined') return;
    cssTimeout = setTimeout(function() {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for(var i = 0; i < links.length; i++){
            // $FlowFixMe[incompatible-type]
            var href /*: string */  = links[i].getAttribute('href');
            var hostname = getHostname();
            var servedFromHMRServer = hostname === 'localhost' ? new RegExp('^(https?:\\/\\/(0.0.0.0|127.0.0.1)|localhost):' + getPort()).test(href) : href.indexOf(hostname + ':' + getPort());
            var absolute = /^https?:\/\//i.test(href) && href.indexOf(location.origin) !== 0 && !servedFromHMRServer;
            if (!absolute) updateLink(links[i]);
        }
        cssTimeout = null;
    }, 50);
}
function hmrDownload(asset) {
    if (asset.type === 'js') {
        if (typeof document !== 'undefined') {
            let script = document.createElement('script');
            script.src = asset.url + '?t=' + Date.now();
            if (asset.outputFormat === 'esmodule') script.type = 'module';
            return new Promise((resolve, reject)=>{
                var _document$head;
                script.onload = ()=>resolve(script);
                script.onerror = reject;
                (_document$head = document.head) === null || _document$head === void 0 || _document$head.appendChild(script);
            });
        } else if (typeof importScripts === 'function') {
            // Worker scripts
            if (asset.outputFormat === 'esmodule') return import(asset.url + '?t=' + Date.now());
            else return new Promise((resolve, reject)=>{
                try {
                    importScripts(asset.url + '?t=' + Date.now());
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        }
    }
}
async function hmrApplyUpdates(assets) {
    global.parcelHotUpdate = Object.create(null);
    let scriptsToRemove;
    try {
        // If sourceURL comments aren't supported in eval, we need to load
        // the update from the dev server over HTTP so that stack traces
        // are correct in errors/logs. This is much slower than eval, so
        // we only do it if needed (currently just Safari).
        // https://bugs.webkit.org/show_bug.cgi?id=137297
        // This path is also taken if a CSP disallows eval.
        if (!supportsSourceURL) {
            let promises = assets.map((asset)=>{
                var _hmrDownload;
                return (_hmrDownload = hmrDownload(asset)) === null || _hmrDownload === void 0 ? void 0 : _hmrDownload.catch((err)=>{
                    // Web extension fix
                    if (extCtx && extCtx.runtime && extCtx.runtime.getManifest().manifest_version == 3 && typeof ServiceWorkerGlobalScope != 'undefined' && global instanceof ServiceWorkerGlobalScope) {
                        extCtx.runtime.reload();
                        return;
                    }
                    throw err;
                });
            });
            scriptsToRemove = await Promise.all(promises);
        }
        assets.forEach(function(asset) {
            hmrApply(module.bundle.root, asset);
        });
    } finally{
        delete global.parcelHotUpdate;
        if (scriptsToRemove) scriptsToRemove.forEach((script)=>{
            if (script) {
                var _document$head2;
                (_document$head2 = document.head) === null || _document$head2 === void 0 || _document$head2.removeChild(script);
            }
        });
    }
}
function hmrApply(bundle /*: ParcelRequire */ , asset /*:  HMRAsset */ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (asset.type === 'css') reloadCSS();
    else if (asset.type === 'js') {
        let deps = asset.depsByBundle[bundle.HMR_BUNDLE_ID];
        if (deps) {
            if (modules[asset.id]) {
                // Remove dependencies that are removed and will become orphaned.
                // This is necessary so that if the asset is added back again, the cache is gone, and we prevent a full page reload.
                let oldDeps = modules[asset.id][1];
                for(let dep in oldDeps)if (!deps[dep] || deps[dep] !== oldDeps[dep]) {
                    let id = oldDeps[dep];
                    let parents = getParents(module.bundle.root, id);
                    if (parents.length === 1) hmrDelete(module.bundle.root, id);
                }
            }
            if (supportsSourceURL) // Global eval. We would use `new Function` here but browser
            // support for source maps is better with eval.
            (0, eval)(asset.output);
            // $FlowFixMe
            let fn = global.parcelHotUpdate[asset.id];
            modules[asset.id] = [
                fn,
                deps
            ];
        }
        // Always traverse to the parent bundle, even if we already replaced the asset in this bundle.
        // This is required in case modules are duplicated. We need to ensure all instances have the updated code.
        if (bundle.parent) hmrApply(bundle.parent, asset);
    }
}
function hmrDelete(bundle, id) {
    let modules = bundle.modules;
    if (!modules) return;
    if (modules[id]) {
        // Collect dependencies that will become orphaned when this module is deleted.
        let deps = modules[id][1];
        let orphans = [];
        for(let dep in deps){
            let parents = getParents(module.bundle.root, deps[dep]);
            if (parents.length === 1) orphans.push(deps[dep]);
        }
        // Delete the module. This must be done before deleting dependencies in case of circular dependencies.
        delete modules[id];
        delete bundle.cache[id];
        // Now delete the orphans.
        orphans.forEach((id)=>{
            hmrDelete(module.bundle.root, id);
        });
    } else if (bundle.parent) hmrDelete(bundle.parent, id);
}
function hmrAcceptCheck(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    checkedAssets = {};
    if (hmrAcceptCheckOne(bundle, id, depsByBundle)) return true;
    // Traverse parents breadth first. All possible ancestries must accept the HMR update, or we'll reload.
    let parents = getParents(module.bundle.root, id);
    let accepted = false;
    while(parents.length > 0){
        let v = parents.shift();
        let a = hmrAcceptCheckOne(v[0], v[1], null);
        if (a) // If this parent accepts, stop traversing upward, but still consider siblings.
        accepted = true;
        else if (a !== null) {
            // Otherwise, queue the parents in the next level upward.
            let p = getParents(module.bundle.root, v[1]);
            if (p.length === 0) {
                // If there are no parents, then we've reached an entry without accepting. Reload.
                accepted = false;
                break;
            }
            parents.push(...p);
        }
    }
    return accepted;
}
function hmrAcceptCheckOne(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (depsByBundle && !depsByBundle[bundle.HMR_BUNDLE_ID]) {
        // If we reached the root bundle without finding where the asset should go,
        // there's nothing to do. Mark as "accepted" so we don't reload the page.
        if (!bundle.parent) {
            bundleNotFound = true;
            return true;
        }
        return hmrAcceptCheckOne(bundle.parent, id, depsByBundle);
    }
    if (checkedAssets[id]) return null;
    checkedAssets[id] = true;
    var cached = bundle.cache[id];
    if (!cached) return true;
    assetsToDispose.push([
        bundle,
        id
    ]);
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
        assetsToAccept.push([
            bundle,
            id
        ]);
        return true;
    }
    return false;
}
function hmrDisposeQueue() {
    // Dispose all old assets.
    for(let i = 0; i < assetsToDispose.length; i++){
        let id = assetsToDispose[i][1];
        if (!disposedAssets[id]) {
            hmrDispose(assetsToDispose[i][0], id);
            disposedAssets[id] = true;
        }
    }
    assetsToDispose = [];
}
function hmrDispose(bundle /*: ParcelRequire */ , id /*: string */ ) {
    var cached = bundle.cache[id];
    bundle.hotData[id] = {};
    if (cached && cached.hot) cached.hot.data = bundle.hotData[id];
    if (cached && cached.hot && cached.hot._disposeCallbacks.length) cached.hot._disposeCallbacks.forEach(function(cb) {
        cb(bundle.hotData[id]);
    });
    delete bundle.cache[id];
}
function hmrAccept(bundle /*: ParcelRequire */ , id /*: string */ ) {
    // Execute the module.
    bundle(id);
    // Run the accept callbacks in the new version of the module.
    var cached = bundle.cache[id];
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
        let assetsToAlsoAccept = [];
        cached.hot._acceptCallbacks.forEach(function(cb) {
            let additionalAssets = cb(function() {
                return getParents(module.bundle.root, id);
            });
            if (Array.isArray(additionalAssets) && additionalAssets.length) assetsToAlsoAccept.push(...additionalAssets);
        });
        if (assetsToAlsoAccept.length) {
            let handled = assetsToAlsoAccept.every(function(a) {
                return hmrAcceptCheck(a[0], a[1]);
            });
            if (!handled) return fullReload();
            hmrDisposeQueue();
        }
    }
}

},{}],"9ZW9C":[function(require,module,exports,__globalThis) {
var _interopRequireDefault = require("b6efd283c65de705");
var React = _interopRequireWildcard(require("4d5311bcde8b9749"));
var _client = require("59ee549e0c7c42d6");
var _App = _interopRequireDefault(require("53a5538ded9bb502"));
var _jsxRuntime = require("e8ec1b9fc82779f");
var _jsxFileName = "/home/user/development/workspaces/BeanAuditorApp/index.web.js";
function _interopRequireWildcard(e, t) {
    if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap();
    return (_interopRequireWildcard = function(e, t) {
        if (!t && e && e.__esModule) return e;
        var o, i, f = {
            __proto__: null,
            default: e
        };
        if (null === e || "object" != typeof e && "function" != typeof e) return f;
        if (o = t ? n : r) {
            if (o.has(e)) return o.get(e);
            o.set(e, f);
        }
        for(var _t in e)"default" !== _t && ({}).hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]);
        return f;
    })(e, t);
}
var rootTag = document.getElementById('root');
(0, _client.createRoot)(rootTag).render(/*#__PURE__*/ (0, _jsxRuntime.jsx)(_App.default, {}));

},{"b6efd283c65de705":"@babel/runtime/helpers/interopRequireDefault","4d5311bcde8b9749":"react","59ee549e0c7c42d6":"react-dom/client","53a5538ded9bb502":"fP9wH","e8ec1b9fc82779f":"react/jsx-runtime"}],"fP9wH":[function(require,module,exports,__globalThis) {
var _interopRequireDefault = require("1e1a96014f6a2323");
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = App;
var _asyncToGenerator2 = _interopRequireDefault(require("c25d68fd455fcb18"));
var _react = _interopRequireDefault(require("39dc25d3ba83b6da"));
var _reactNative = require("57c98a0f153e0bc4");
var _reactNativePaper = require("6ade48aaef1eac2e");
var _native = require("bec6b2c98845bf90");
var _nativeStack = require("f85921d02eda54a5");
var _reactHookForm = require("343a1cb1c40c7fe9");
var _reactQuery = require("f4dc675ceeff5d1d");
var _axios = _interopRequireDefault(require("79ae0d177f37d9f4"));
var _zustand = require("6200a3103154e0e0");
var _LoginScreen = _interopRequireDefault(require("26f982bb470b2355"));
var _useAuthStore = require("2e468af5825611ae");
var _jsxRuntime = require("d2111c58a366f938");
var _jsxFileName = "/home/user/development/workspaces/BeanAuditorApp/App.tsx";
var useCounterStore = (0, _zustand.create)()((set)=>({
        count: 0,
        increment: ()=>set((state)=>({
                    count: state.count + 1
                }))
    }));
var queryClient = new _reactQuery.QueryClient();
var Stack = (0, _nativeStack.createNativeStackNavigator)();
var AppIcon = ()=>/*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Text, {
        children: "\u2615"
    });
var ExampleHome = ({ navigation })=>{
    var _useCounterStore = useCounterStore(), count = _useCounterStore.count, increment = _useCounterStore.increment;
    var logout = (0, _useAuthStore.useAuthStore)((state)=>state.logout);
    var _useForm = (0, _reactHookForm.useForm)({
        defaultValues: {
            nombre: ''
        }
    }), control = _useForm.control, handleSubmit = _useForm.handleSubmit;
    var _useQuery = (0, _reactQuery.useQuery)({
        queryKey: [
            'example'
        ],
        queryFn: function() {
            var _ref = (0, _asyncToGenerator2.default)(function*() {
                var resp = yield _axios.default.get('https://jsonplaceholder.typicode.com/todos/1');
                return resp.data;
            });
            return function queryFn() {
                return _ref.apply(this, arguments);
            };
        }()
    }), data = _useQuery.data, isLoading = _useQuery.isLoading;
    var handleNotify = /*#__PURE__*/ function() {
        var _ref2 = (0, _asyncToGenerator2.default)(function*() {
            if (typeof globalThis !== 'undefined' && 'document' in globalThis) {
                _reactNative.Alert.alert('Notificaciones no disponibles en web');
                return;
            }
            try {
                var PushNotification = require("efb4f4b12d436e19");
                PushNotification.localNotification({
                    title: "Prueba de notificaci\xf3n",
                    message: "\xa1Esta es una notificaci\xf3n local!"
                });
            } catch (err) {
            // Ignorado: solo demo
            }
        });
        return function handleNotify() {
            return _ref2.apply(this, arguments);
        };
    }();
    return /*#__PURE__*/ (0, _jsxRuntime.jsxs)(_reactNative.View, {
        style: styles.container,
        children: [
            /*#__PURE__*/ (0, _jsxRuntime.jsxs)(_reactNativePaper.Text, {
                variant: "titleLarge",
                children: [
                    /*#__PURE__*/ (0, _jsxRuntime.jsx)(AppIcon, {}),
                    " BeanAuditorApp"
                ]
            }),
            /*#__PURE__*/ (0, _jsxRuntime.jsxs)(_reactNativePaper.Button, {
                mode: "contained",
                onPress: increment,
                style: styles.buttonSpacing,
                children: [
                    "Contador Zustand: ",
                    count
                ]
            }),
            /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Button, {
                mode: "outlined",
                onPress: handleNotify,
                style: styles.buttonSpacing,
                children: "Enviar Notificaci\xF3n"
            }),
            /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Button, {
                mode: "outlined",
                onPress: logout,
                style: styles.buttonSpacing,
                children: "Cerrar sesi\xF3n"
            }),
            /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Text, {
                variant: "titleMedium",
                children: "Petici\xF3n API con React Query:"
            }),
            isLoading ? /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Text, {
                children: "Loading..."
            }) : /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Text, {
                children: JSON.stringify(data)
            }),
            /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactHookForm.Controller, {
                control: control,
                name: "nombre",
                render: ({ field: { value } })=>/*#__PURE__*/ (0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
                        children: [
                            /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Text, {
                                variant: "bodyLarge",
                                style: styles.sectionSpacing,
                                children: "Formulario (React Hook Form):"
                            }),
                            /*#__PURE__*/ (0, _jsxRuntime.jsxs)(_reactNativePaper.Button, {
                                mode: "outlined",
                                onPress: handleSubmit((data)=>_reactNative.Alert.alert(String(data.nombre))),
                                children: [
                                    "Enviar: ",
                                    value
                                ]
                            })
                        ]
                    })
            }),
            /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Button, {
                onPress: ()=>navigation.navigate('Splash'),
                children: "Ir al SplashScreen"
            })
        ]
    });
};
var SplashFake = ()=>/*#__PURE__*/ (0, _jsxRuntime.jsxs)(_reactNative.View, {
        style: styles.container,
        children: [
            /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Text, {
                variant: "headlineMedium",
                children: "SplashScreen de ejemplo"
            }),
            /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Text, {
                children: "\uD83D\uDD12"
            }),
            /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Text, {
                children: "Implementaci\xF3n completa requiere ajustes nativos."
            })
        ]
    });
function MainStack() {
    var isLoggedIn = (0, _useAuthStore.useAuthStore)((state)=>state.isLoggedIn);
    return /*#__PURE__*/ (0, _jsxRuntime.jsx)(Stack.Navigator, {
        screenOptions: {
            headerShown: false
        },
        children: isLoggedIn ? /*#__PURE__*/ (0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [
                /*#__PURE__*/ (0, _jsxRuntime.jsx)(Stack.Screen, {
                    name: "Home",
                    component: ExampleHome,
                    options: {
                        title: 'Inicio'
                    }
                }),
                /*#__PURE__*/ (0, _jsxRuntime.jsx)(Stack.Screen, {
                    name: "Splash",
                    component: SplashFake,
                    options: {
                        title: 'Splash'
                    }
                })
            ]
        }) : /*#__PURE__*/ (0, _jsxRuntime.jsx)(Stack.Screen, {
            name: "Login",
            component: _LoginScreen.default
        })
    });
}
function App() {
    return /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Provider, {
        theme: _reactNativePaper.DefaultTheme,
        children: /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactQuery.QueryClientProvider, {
            client: queryClient,
            children: /*#__PURE__*/ (0, _jsxRuntime.jsxs)(_native.NavigationContainer, {
                children: [
                    /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNative.StatusBar, {
                        backgroundColor: "#6200ee",
                        barStyle: "light-content"
                    }),
                    /*#__PURE__*/ (0, _jsxRuntime.jsx)(MainStack, {})
                ]
            })
        })
    });
}
var styles = _reactNative.StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
    },
    buttonSpacing: {
        marginVertical: 8
    },
    sectionSpacing: {
        marginTop: 16
    }
});

},{"1e1a96014f6a2323":"@babel/runtime/helpers/interopRequireDefault","c25d68fd455fcb18":"@babel/runtime/helpers/asyncToGenerator","39dc25d3ba83b6da":"react","57c98a0f153e0bc4":"react-native","6ade48aaef1eac2e":"react-native-paper","bec6b2c98845bf90":"@react-navigation/native","f85921d02eda54a5":"@react-navigation/native-stack","343a1cb1c40c7fe9":"react-hook-form","f4dc675ceeff5d1d":"@tanstack/react-query","79ae0d177f37d9f4":"axios","6200a3103154e0e0":"zustand","26f982bb470b2355":"9wEew","2e468af5825611ae":"4QmHQ","d2111c58a366f938":"react/jsx-runtime","efb4f4b12d436e19":"react-native-push-notification"}],"9wEew":[function(require,module,exports,__globalThis) {
var _interopRequireDefault = require("13f0d2129259e7e3");
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = LoginScreen;
var _react = _interopRequireDefault(require("eeb9e022d97007ff"));
var _reactNative = require("9d4072b6b7946a3");
var _reactNativePaper = require("1abfda930392bad4");
var _reactHookForm = require("2f080f81c1c073dc");
var _useAuthStore2 = require("8397620068ea21fd");
var _jsxRuntime = require("3073d2f150545a5a");
var _jsxFileName = "/home/user/development/workspaces/BeanAuditorApp/screens/LoginScreen.tsx";
var loginImage = {
    uri: 'https://reactnative.dev/img/tiny_logo.png'
}; // Fácilmente configurable
function LoginScreen() {
    var theme = (0, _reactNativePaper.useTheme)();
    var _useAuthStore = (0, _useAuthStore2.useAuthStore)(), username = _useAuthStore.username, setUsername = _useAuthStore.setUsername, password = _useAuthStore.password, setPassword = _useAuthStore.setPassword, login = _useAuthStore.login;
    var _useForm = (0, _reactHookForm.useForm)({
        defaultValues: {
            username,
            password
        },
        mode: 'onChange'
    }), control = _useForm.control, handleSubmit = _useForm.handleSubmit, errors = _useForm.formState.errors;
    // Formulario envía datos al store, luego llama login
    var onSubmit = ()=>{
        login();
    };
    return /*#__PURE__*/ (0, _jsxRuntime.jsxs)(_reactNative.View, {
        style: styles.container,
        children: [
            /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Text, {
                variant: "headlineMedium",
                style: styles.title,
                children: "BeanAuditorApp"
            }),
            /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNative.Image, {
                source: loginImage,
                style: styles.image,
                resizeMode: "contain"
            }),
            /*#__PURE__*/ (0, _jsxRuntime.jsxs)(_reactNative.View, {
                style: {
                    width: '100%',
                    marginTop: 24
                },
                children: [
                    /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactHookForm.Controller, {
                        control: control,
                        name: "username",
                        rules: {
                            required: 'Ingresa tu usuario'
                        },
                        render: ({ field: { onChange, value, onBlur } })=>/*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.TextInput, {
                                label: "Usuario",
                                mode: "outlined",
                                value: value,
                                onBlur: onBlur,
                                onChangeText: (val)=>{
                                    setUsername(val);
                                    onChange(val);
                                },
                                error: !!errors.username,
                                style: styles.input,
                                autoCapitalize: "none"
                            })
                    }),
                    errors.username && /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Text, {
                        style: styles.error,
                        children: errors.username.message
                    }),
                    /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactHookForm.Controller, {
                        control: control,
                        name: "password",
                        rules: {
                            required: "Ingresa tu contrase\xf1a"
                        },
                        render: ({ field: { onChange, value, onBlur } })=>/*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.TextInput, {
                                label: "Contrase\xF1a",
                                mode: "outlined",
                                value: value,
                                onBlur: onBlur,
                                onChangeText: (val)=>{
                                    setPassword(val);
                                    onChange(val);
                                },
                                secureTextEntry: true,
                                error: !!errors.password,
                                style: styles.input,
                                autoCapitalize: "none"
                            })
                    }),
                    errors.password && /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Text, {
                        style: styles.error,
                        children: errors.password.message
                    })
                ]
            }),
            /*#__PURE__*/ (0, _jsxRuntime.jsx)(_reactNativePaper.Button, {
                mode: "contained",
                onPress: handleSubmit(onSubmit),
                style: styles.loginBtn,
                disabled: !!errors.username || !!errors.password,
                children: "Iniciar sesi\xF3n"
            })
        ]
    });
}
var styles = _reactNative.StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff'
    },
    title: {
        marginBottom: 16,
        fontWeight: 'bold'
    },
    image: {
        width: 120,
        height: 120,
        marginBottom: 16
    },
    input: {
        marginVertical: 8
    },
    loginBtn: {
        marginTop: 32,
        width: '100%'
    },
    error: {
        color: '#E53935',
        alignSelf: 'flex-start',
        marginBottom: 4,
        fontSize: 13
    }
});

},{"13f0d2129259e7e3":"@babel/runtime/helpers/interopRequireDefault","eeb9e022d97007ff":"react","9d4072b6b7946a3":"react-native","1abfda930392bad4":"react-native-paper","2f080f81c1c073dc":"react-hook-form","8397620068ea21fd":"4QmHQ","3073d2f150545a5a":"react/jsx-runtime"}],"4QmHQ":[function(require,module,exports,__globalThis) {
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.useAuthStore = void 0;
var _zustand = require("2dbf31194755e331");
var useAuthStore = exports.useAuthStore = (0, _zustand.create)()((set, get)=>({
        username: '',
        password: '',
        isLoggedIn: false,
        setUsername: (username)=>set(()=>({
                    username
                })),
        setPassword: (password)=>set(()=>({
                    password
                })),
        login: ()=>{
            var _get = get(), username = _get.username, password = _get.password;
            if (username.trim() !== '' && password.trim() !== '') set(()=>({
                    isLoggedIn: true
                }));
        },
        logout: ()=>set(()=>({
                    isLoggedIn: false,
                    username: '',
                    password: ''
                }))
    }));

},{"2dbf31194755e331":"zustand"}]},["eyYlO","9ZW9C"], "9ZW9C", "parcelRequire5e7b", {"@babel/runtime/helpers/interopRequireDefault": __parcelExternal0,"react": __parcelExternal1,"react-dom/client": __parcelExternal2,"react/jsx-runtime": __parcelExternal3,"@babel/runtime/helpers/asyncToGenerator": __parcelExternal4,"react-native": __parcelExternal5,"react-native-paper": __parcelExternal6,"@react-navigation/native": __parcelExternal7,"@react-navigation/native-stack": __parcelExternal8,"react-hook-form": __parcelExternal9,"@tanstack/react-query": __parcelExternal10,"axios": __parcelExternal11,"zustand": __parcelExternal12,})
let {} = parcelRequire5e7b("9ZW9C");
export {};

//# sourceMappingURL=public.ced9d258.js.map
