/*! Built with http://stenciljs.com */
const { h } = window.indicator;

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

/* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */
// TypeScript 2.1 no longer allows you to extend built in types. See https://github.com/Microsoft/TypeScript/issues/12790#issuecomment-265981442
// and https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
//
// This code is from MDN https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Custom_Error_Types.
var ArcGISRequestError = /** @class */ (function () {
    /**
     * Create a new `ArcGISRequestError`  object.
     *
     * @param message - The error message from the API
     * @param code - The error code from the API
     * @param response - The original response from the API that caused the error
     * @param url - The original url of the request
     * @param options - The original options and parameters of the request
     */
    function ArcGISRequestError(message, code, response, url, options) {
        message = message || "UNKNOWN_ERROR";
        code = code || "UNKNOWN_ERROR_CODE";
        this.name = "ArcGISRequestError";
        this.message =
            code === "UNKNOWN_ERROR_CODE" ? message : code + ": " + message;
        this.originalMessage = message;
        this.code = code;
        this.response = response;
        this.url = url;
        this.options = options;
    }
    return ArcGISRequestError;
}());
ArcGISRequestError.prototype = Object.create(Error.prototype);
ArcGISRequestError.prototype.constructor = ArcGISRequestError;

/* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */
var ArcGISAuthError = /** @class */ (function (_super) {
    __extends(ArcGISAuthError, _super);
    /**
     * Create a new `ArcGISAuthError`  object.
     *
     * @param message - The error message from the API
     * @param code - The error code from the API
     * @param response - The original response from the API that caused the error
     * @param url - The original url of the request
     * @param options - The original options of the request
     */
    function ArcGISAuthError(message, code, response, url, options) {
        if (message === void 0) { message = "AUTHENTICATION_ERROR"; }
        if (code === void 0) { code = "AUTHENTICATION_ERROR_CODE"; }
        var _this = _super.call(this, message, code, response, url, options) || this;
        _this.name = "ArcGISAuthError";
        _this.message =
            code === "AUTHENTICATION_ERROR_CODE" ? message : code + ": " + message;
        return _this;
    }
    ArcGISAuthError.prototype.retry = function (getSession, retryLimit) {
        var _this = this;
        if (retryLimit === void 0) { retryLimit = 3; }
        var tries = 0;
        var retryRequest = function (resolve, reject) {
            getSession(_this.url, _this.options)
                .then(function (session) {
                var newOptions = __assign({}, _this.options, { authentication: session });
                tries = tries + 1;
                return request(_this.url, newOptions);
            })
                .then(function (response) {
                resolve(response);
            })
                .catch(function (e) {
                if (e.name === "ArcGISAuthError" && tries < retryLimit) {
                    retryRequest(resolve, reject);
                }
                else if (e.name === "ArcGISAuthError" && tries >= retryLimit) {
                    reject(_this);
                }
                else {
                    reject(e);
                }
            });
        };
        return new Promise(function (resolve, reject) {
            retryRequest(resolve, reject);
        });
    };
    return ArcGISAuthError;
}(ArcGISRequestError));

/* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */
/**
 * Checks for errors in a JSON response from the ArcGIS REST API. If there are no errors, it will return the `data` passed in. If there is an error, it will throw an `ArcGISRequestError` or `ArcGISAuthError`.
 *
 * @param data The response JSON to check for errors.
 * @param url The url of the original request
 * @param params The parameters of the original request
 * @param options The options of the original request
 * @returns The data that was passed in the `data` parameter
 */
function checkForErrors(response, url, params, options) {
    // this is an error message from billing.arcgis.com backend
    if (response.code >= 400) {
        var message = response.message, code = response.code;
        throw new ArcGISRequestError(message, code, response, url, options);
    }
    // error from ArcGIS Online or an ArcGIS Portal or server instance.
    if (response.error) {
        var _a = response.error, message = _a.message, code = _a.code, messageCode = _a.messageCode;
        var errorCode = messageCode || code || "UNKNOWN_ERROR_CODE";
        if (code === 498 || code === 499 || messageCode === "GWM_0003") {
            throw new ArcGISAuthError(message, errorCode, response, url, options);
        }
        throw new ArcGISRequestError(message, errorCode, response, url, options);
    }
    // error from a status check
    if (response.status === "failed" || response.status === "failure") {
        var message = void 0;
        var code = "UNKNOWN_ERROR_CODE";
        try {
            message = JSON.parse(response.statusMessage).message;
            code = JSON.parse(response.statusMessage).code;
        }
        catch (e) {
            message = response.statusMessage || response.message;
        }
        throw new ArcGISRequestError(message, code, response, url, options);
    }
    return response;
}

/* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
* Apache-2.0 */
/**
 * Checks parameters to see if we should use FormData to send the request
 * @param params The object whose keys will be encoded.
 * @return A boolean indicating if FormData will be required.
 */
function requiresFormData(params) {
    return Object.keys(params).some(function (key) {
        var value = params[key];
        if (!value) {
            return false;
        }
        var type = value.constructor.name;
        switch (type) {
            case "Array":
                return false;
            case "Object":
                return false;
            case "Date":
                return false;
            case "Function":
                return false;
            case "Boolean":
                return false;
            case "String":
                return false;
            case "Number":
                return false;
            default:
                return true;
        }
    });
}
/**
 * Converts parameters to the proper representation to send to the ArcGIS REST API.
 * @param params The object whose keys will be encoded.
 * @return A new object with properly encoded values.
 */
function processParams(params) {
    var newParams = {};
    Object.keys(params).forEach(function (key) {
        var param = params[key];
        if (!param &&
            param !== 0 &&
            typeof param !== "boolean" &&
            typeof param !== "string") {
            return;
        }
        var type = param.constructor.name;
        var value;
        // properly encodes objects, arrays and dates for arcgis.com and other services.
        // ported from https://github.com/Esri/esri-leaflet/blob/master/src/Request.js#L22-L30
        // also see https://github.com/Esri/arcgis-rest-js/issues/18:
        // null, undefined, function are excluded. If you want to send an empty key you need to send an empty string "".
        switch (type) {
            case "Array":
                // Based on the first element of the array, classify array as an array of objects to be stringified
                // or an array of non-objects to be comma-separated
                value =
                    param[0] &&
                        param[0].constructor &&
                        param[0].constructor.name === "Object"
                        ? JSON.stringify(param)
                        : param.join(",");
                break;
            case "Object":
                value = JSON.stringify(param);
                break;
            case "Date":
                value = param.valueOf();
                break;
            case "Function":
                value = null;
                break;
            case "Boolean":
                value = param + "";
                break;
            default:
                value = param;
                break;
        }
        if (value || value === 0 || typeof value === "string") {
            newParams[key] = value;
        }
    });
    return newParams;
}

/* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */
function encodeParam(key, value) {
    return encodeURIComponent(key) + "=" + encodeURIComponent(value);
}
/**
 * Encodes the passed object as a query string.
 *
 * @param params An object to be encoded.
 * @returns An encoded query string.
 */
function encodeQueryString(params) {
    var newParams = processParams(params);
    return Object.keys(newParams)
        .map(function (key) {
        return encodeParam(key, newParams[key]);
    })
        .join("&");
}

/* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */
/**
 * Encodes parameters in a [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object in browsers or in a [FormData](https://github.com/form-data/form-data) in Node.js
 *
 * @param params An object to be encoded.
 * @returns The complete [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object.
 */
function encodeFormData(params) {
    var useFormData = requiresFormData(params);
    var newParams = processParams(params);
    if (useFormData) {
        var formData_1 = new FormData();
        Object.keys(newParams).forEach(function (key) {
            if (typeof Blob !== "undefined" && newParams[key] instanceof Blob) {
                /* To name the Blob:
                 1. look to an alternate request parameter called 'fileName'
                 2. see if 'name' has been tacked onto the Blob manually
                 3. if all else fails, use the request parameter
                */
                var filename = newParams["fileName"] || newParams[key].name || key;
                formData_1.append(key, newParams[key], filename);
            }
            else {
                formData_1.append(key, newParams[key]);
            }
        });
        return formData_1;
    }
    else {
        return encodeQueryString(params);
    }
}

/* Copyright (c) 2017-2018 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */
/**
 * Generic method for making HTTP requests to ArcGIS REST API endpoints.
 *
 * ```js
 * import { request } from '@esri/arcgis-rest-request';
 *
 * request('https://www.arcgis.com/sharing/rest')
 *   .then((response) => {
 *     console.log(response.currentVersion); // => 5.2
 *   });
 * ```
 *
 * ```js
 * import { request, HTTPMethods } from '@esri/arcgis-rest-request';
 *
 * request('https://www.arcgis.com/sharing/rest', {
 *   httpMethod: "GET"
 * }).then((response) => {
 *   console.log(response.currentVersion); // => 5.2
 * });
 * ```
 *
 * ```js
 * import { request, HTTPMethods } from '@esri/arcgis-rest-request';
 *
 * request('https://www.arcgis.com/sharing/rest/search', {
 *   params: { q: 'parks' }
 * }).then((response) => {
 *   console.log(response.total); // => 78379
 * });
 * ```
 *
 * @param url - The URL of the ArcGIS REST API endpoint.
 * @param requestOptions - Options for the request, including parameters relevant to the endpoint.
 * @returns A Promise that will resolve with the data from the response.
 */
function request(url, requestOptions) {
    if (requestOptions === void 0) { requestOptions = { params: { f: "json" } }; }
    var options = __assign({ httpMethod: "POST" }, requestOptions);
    var missingGlobals = [];
    var recommendedPackages = [];
    // don't check for a global fetch if a custom implementation was passed through
    if (!options.fetch && typeof fetch !== "undefined") {
        options.fetch = fetch.bind(Function("return this")());
    }
    else {
        missingGlobals.push("`fetch`");
        recommendedPackages.push("`isomorphic-fetch`");
    }
    if (typeof Promise === "undefined") {
        missingGlobals.push("`Promise`");
        recommendedPackages.push("`es6-promise`");
    }
    if (typeof FormData === "undefined") {
        missingGlobals.push("`FormData`");
        recommendedPackages.push("`isomorphic-form-data`");
    }
    if (!options.fetch ||
        typeof Promise === "undefined" ||
        typeof FormData === "undefined") {
        throw new Error("`arcgis-rest-request` requires global variables for `fetch`, `Promise` and `FormData` to be present in the global scope. You are missing " + missingGlobals.join(", ") + ". We recommend installing the " + recommendedPackages.join(", ") + " modules at the root of your application to add these to the global scope. See https://bit.ly/2KNwWaJ for more info.");
    }
    var httpMethod = options.httpMethod, authentication = options.authentication;
    var params = __assign({ f: "json" }, requestOptions.params);
    var fetchOptions = {
        method: httpMethod,
        // ensures behavior mimics XMLHttpRequest. needed to support sending IWA cookies
        credentials: "same-origin"
    };
    return (authentication
        ? authentication.getToken(url, {
            fetch: options.fetch
        })
        : Promise.resolve(""))
        .then(function (token) {
        if (token.length) {
            params.token = token;
        }
        if (fetchOptions.method === "GET") {
            // encode the parameters into the query string
            var queryParams = encodeQueryString(params);
            // dont append a '?' unless parameters are actually present
            var urlWithQueryString = queryParams === "" ? url : url + "?" + encodeQueryString(params);
            if (options.maxUrlLength &&
                urlWithQueryString.length > options.maxUrlLength) {
                // the consumer specified a maximum length for URLs
                // and this would exceed it, so use post instead
                fetchOptions.method = "POST";
            }
            else {
                // just use GET
                url = urlWithQueryString;
            }
        }
        if (fetchOptions.method === "POST") {
            fetchOptions.body = encodeFormData(params);
        }
        /* istanbul ignore else blob responses are difficult to make cross platform we will just have to trust the isomorphic fetch will do its job */
        if (!requiresFormData(params)) {
            fetchOptions.headers = {};
            fetchOptions.headers["Content-Type"] =
                "application/x-www-form-urlencoded";
        }
        return options.fetch(url, fetchOptions);
    })
        .then(function (response) {
        if (!response.ok) {
            // server responded w/ an actual error (404, 500, etc)
            var status_1 = response.status, statusText = response.statusText;
            throw new ArcGISRequestError(statusText, "HTTP " + status_1, response, url, options);
        }
        switch (params.f) {
            case "json":
                return response.json();
            case "geojson":
                return response.json();
            case "html":
                return response.text();
            case "text":
                return response.text();
            /* istanbul ignore next blob responses are difficult to make cross platform we will just have to trust the isomorphic fetch will do its job */
            case "image":
                return response.blob();
            /* istanbul ignore next */
            case "zip":
                return response.blob();
            /* istanbul ignore next */
            default:
                // hopefully we never need to handle JSON payloads when no f= parameter is set
                return response.blob();
        }
    })
        .then(function (data) {
        if (params.f === "json" || params.f === "geojson") {
            return checkForErrors(data, url, params, options);
        }
        else {
            return data;
        }
    });
}

/* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */
/**
 * Enum describing the different errors that might be thrown by a request.
 *
 * ```ts
 * import { request, ErrorTypes } from '@esri/arcgis-rest-request';
 *
 * request("...").catch((e) => {
 *   switch(e.name) {
 *     case ErrorType.ArcGISRequestError:
 *     // handle a general error from the API
 *     break;
 *
 *     case ErrorType.ArcGISAuthError:
 *     // handle an authentication error
 *     break;
 *
 *     default:
 *     // handle some other error (usually a network error)
 *   }
 * });
 * ```
 */
var ErrorTypes;
(function (ErrorTypes) {
    ErrorTypes["ArcGISRequestError"] = "ArcGISRequestError";
    ErrorTypes["ArcGISAuthError"] = "ArcGISAuthError";
})(ErrorTypes || (ErrorTypes = {}));

/**
 * Helper that returns the appropriate portal url for a given request. `requestOptions.portal` is given
 * precedence over `authentication.portal`. If neither are present, `www.arcgis.com/sharing/rest` is returned.
 *
 * @param requestOptions - Request options that may have authentication manager
 * @returns Portal url to be used in API requests
 */

/* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */

/* Copyright (c) 2018 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */

/* Copyright (c) 2017-2018 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */
/**
 * Used internally by the package to ensure that first order request options are passed through as request parameters.
 */
function appendCustomParams(oldOptions, newOptions) {
    // only pass query parameters through in the request, not generic IRequestOptions props
    Object.keys(oldOptions).forEach(function (key) {
        if (key !== "url" &&
            key !== "params" &&
            key !== "authentication" &&
            key !== "httpMethod" &&
            key !== "fetch" &&
            key !== "portal" &&
            key !== "maxUrlLength") {
            newOptions.params[key] = oldOptions[key];
        }
    });
}

/* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */
/**
 * Query a feature service. See [REST Documentation](https://developers.arcgis.com/rest/services-reference/query-feature-service-layer-.htm) for more information.
 *
 * ```js
 * import { queryFeatures } from '@esri/arcgis-rest-feature-service';
 *
 * const url = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3";
 *
 * queryFeatures({
 *   url,
 *   where: "STATE_NAME = 'Alaska"
 * }).then(result => {
 *   console.log(result.features); // array of features
 * });
 * ```
 *
 * @param requestOptions - Options for the request
 * @returns A Promise that will resolve with the query response.
 */
function queryFeatures(requestOptions) {
    // default to a GET request
    var options = __assign({ params: {}, httpMethod: "GET", url: requestOptions.url }, requestOptions);
    appendCustomParams(requestOptions, options);
    // set default query parameters
    if (!options.params.where) {
        options.params.where = "1=1";
    }
    if (!options.params.outFields) {
        options.params.outFields = "*";
    }
    return request(options.url + "/query", options);
}

/* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */

/* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */

/* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */

/* Copyright (c) 2018 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */

/* Copyright (c) 2018 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */

/* Copyright (c) 2018 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */

/* Copyright (c) 2018 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */

/* Copyright (c) 2018 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */

/* Copyright (c) 2018 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */

// interface IResourceObject {
//   id: string;
//   attributes: {
//     [key: string]: any;
//   };
// }
class Indicator {
    // Component Methods
    constructor() {
        this.url = "";
        this.attributes = { attributes: [] };
        this.metrics = [];
        this.fields = [];
    }
    getData(query) {
        let url = this.url;
        let params = Object.assign({ url }, query);
        return queryFeatures(params);
    }
    metricType(measures) {
        let now = new Date();
        let oneYr = new Date();
        oneYr.setFullYear(now.getFullYear() - 1);
        let queryDate = oneYr.getFullYear() + "-" + oneYr.getMonth() + "-" + oneYr.getDay();
        console.log("Metrics", this.metrics);
        switch (measures.type) {
            case "datetime": {
                return this.getData({ where: `${measures.name}>DATE '${queryDate}'`, returnCountOnly: true }).then(result => {
                    console.log("result", result); // array of features
                    this.metrics = [
                        ...this.metrics,
                        { "id": measures.name, "name": `Time series ${measures.name}`, "value": `There were ${result.count} instances this year.` }
                    ];
                });
            }
            case "category": {
                let query = {
                    orderByFields: "EXPR_1 DESC",
                    groupByFieldsForStatistics: measures.name,
                    outStatistics: [{ "statisticType": "count", "onStatisticField": measures.name, "outStatisticFieldName": "EXPR_1" }]
                };
                return this.getData(query).then(result => {
                    console.log("result", result); // array of features
                    let enumeration = "<ul>";
                    for (let f in result.features) {
                        enumeration += `<li>${result.features[f].attributes[measures.name]}: ${result.features[f].attributes['EXPR_1']}</li>`;
                    }
                    enumeration += "</ul>";
                    this.metrics = [
                        ...this.metrics,
                        { "id": measures.name, "name": `Category ${measures.name}`, "value": enumeration }
                    ];
                });
            }
            case "value": {
                let query = {
                    outStatistics: [{ "statisticType": "sum", "onStatisticField": measures.name, "outStatisticFieldName": "EXPR_1" }]
                };
                return this.getData(query).then(result => {
                    console.log("result value", result); // array of features
                    this.metrics = [
                        ...this.metrics,
                        { "id": measures.name, "name": `Time series ${measures.name}`, "value": `There were ${result.features[0].attributes['EXPR_1']} instances this year.` }
                    ];
                });
            }
        }
    }
    componentWillLoad() {
        // this.metrics = [];
        if (this.schema !== undefined && this.schema !== null) {
            this.attributes = JSON.parse(this.schema);
            console.log("attributes", this.attributes);
            for (let attribute in this.attributes.attributes) {
                console.log("attr", this.attributes.attributes[attribute]);
                this.metricType(this.attributes.attributes[attribute]);
            }
        }
    }
    handleChange(event) {
        this.fields = [];
        this.metrics = [];
        this.url = this.urlInput.value;
        console.log("handleChange", event);
        request(this.url).then(response => {
            console.log(response); // WebMap JSON
            this.fields = response.fields;
        });
    }
    handleSelect(event) {
        console.log(event.target);
        let setting = { "name": event.target.id, "type": event.target.value };
        console.log("Setting", setting);
        this.attributes.attributes.push(setting);
        this.metricType(setting);
        // this.selectValue = event.target.value;
    }
    render() {
        return ([
            h("form", { id: "indicator-configuration" },
                h("h3", null, "Configure Indicator"),
                h("h4", null, "Dataset URL"),
                h("input", { type: "text", value: this.url, onChange: (event) => this.handleChange(event), ref: (el) => this.urlInput = el }),
                h("h4", null, "Indicator Attributes"),
                this.fields.map((field) => h("div", { class: "indicator-setting" },
                    h("label", null, field.name),
                    h("select", { onInput: (event) => this.handleSelect(event), id: field.name, name: "type" },
                        h("option", { value: "none" }, "None"),
                        h("option", { value: "value" }, "Value"),
                        h("option", { value: "category" }, "Category"),
                        h("option", { value: "datetime" }, "Date/Time")),
                    h("small", null, field.type)))),
            h("div", { id: "indicator-metrics" }, this.metrics.map((metric) => h("div", null,
                h("div", null, metric.name),
                h("div", { innerHTML: metric.value }))))
        ]);
    }
    static get is() { return "hub-indicator"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "attributes": {
            "state": true
        },
        "el": {
            "elementRef": true
        },
        "fields": {
            "state": true
        },
        "metrics": {
            "state": true
        },
        "schema": {
            "type": String,
            "attr": "schema"
        },
        "url": {
            "type": String,
            "attr": "url",
            "mutable": true
        }
    }; }
    static get style() { return ".chart {\n  height: 400px;\n}\n\n#indicator-configuration {\n  width: 500px;\n  float: left;\n}\n.indicator-setting small {\n  font-size: 0.4em;\n  float: right;\n}\nlabel {\n  width: 300px;\n  display: inline-block;\n}\ninput {\n  float: left;\n  font-size: 0.5em;\n  padding: 5px;\n  clear:both;\n  width: 100%\n}\n#indicator-metrics {\n  width: 600px;\n  float: right;\n}\n\nh4 {\n  margin: 10px 0 0 0;\n\n}\ninput[type=submit] {\n  background-color: #007bff;\n  color: white;\n  cursor:pointer;\n}\ninput[type=submit]:hover {\n  background-color: #000099;\n  color: white;\n  cursor:pointer;\n}"; }
}

export { Indicator as HubIndicator };
