// Copyright (c) 2014, the Dart project authors.  Please see the AUTHORS file
// for details. All rights reserved. Use of this source code is governed by a
// BSD-style license that can be found in the LICENSE file.

/**
 * This class provides access to device magnetometer data.
 * @constructor
 */
var argscheck = require('cordova/argscheck'),
    utils = require("cordova/utils"),
    exec = require("cordova/exec"),
    Magnetic = require('./Magnetic');

// Is the magnetometer sensor running?
var running = false;

// Keeps reference to watch calls.
var timers = {};

// Array of listeners; used to keep track of when we should call start and stop.
var listeners = [];
var eventTimerId = null;

// Last returned magnetic object from native
var magnetic = null;

// Tells native to start.
function start() {
    exec(function(a) {
        var tempListeners = listeners.slice(0);
        magnetic = new Magnetic(a.x, a.y, a.z, a.timestamp);
        for (var i = 0, l = tempListeners.length; i < l; i++) {
            tempListeners[i].win(magnetic);
        }
    }, function(e) {
        var tempListeners = listeners.slice(0);
        for (var i = 0, l = tempListeners.length; i < l; i++) {
            tempListeners[i].fail(e);
        }
    }, "Magnetometer", "start", []);
    running = true;
}

// Tells native to stop.
function stop() {
    exec(null, null, "Magnetometer", "stop", []);
    running = false;
}

// Adds a callback pair to the listeners array
function createCallbackPair(win, fail) {
    return {win:win, fail:fail};
}

// Removes a win/fail listener pair from the listeners array
function removeListeners(l) {
    var idx = listeners.indexOf(l);
    if (idx > -1) {
        listeners.splice(idx, 1);
        if (listeners.length === 0) {
            stop();
        }
    }
}

var magnetometer = {
    /**
     * Asynchronously acquires the current magnetic.
     *
     * @param {Function} successCallback    The function to call when the magnetic data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the magnetic data. (OPTIONAL)
     * @param {MagnetometerOptions} options    The options for getting the magnetometer data such as frequency. (OPTIONAL)
     */
    getCurrent: function(successCallback, errorCallback, options) {
        argscheck.checkArgs('fFO', 'magnetometer.getCurrent', arguments);

        var p;
        var win = function(a) {
            removeListeners(p);
            successCallback(a);
        };
        var fail = function(e) {
            removeListeners(p);
            errorCallback && errorCallback(e);
        };

        p = createCallbackPair(win, fail);
        listeners.push(p);

        if (!running) {
            start();
        }
    },

    /**
     * Asynchronously acquires the magnetic repeatedly at a given interval.
     *
     * @param {Function} successCallback    The function to call each time the magnetic data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the magnetic data. (OPTIONAL)
     * @param {MagnetometerOptions} options    The options for getting the magnetometer data such as frequency. (OPTIONAL)
     * @return String                       The watch id that must be passed to #clearWatch to stop watching.
     */
    watch: function(successCallback, errorCallback, options) {
        argscheck.checkArgs('fFO', 'magnetometer.watch', arguments);
        // Default interval (10 sec)
        var frequency = (options && options.frequency && typeof options.frequency == 'number') ? options.frequency : 10000;

        // Keep reference to watch id, and report magnetic readings as often as defined in frequency
        var id = utils.createUUID();

        var p = createCallbackPair(function(){}, function(e) {
            removeListeners(p);
            errorCallback && errorCallback(e);
        });
        listeners.push(p);

        timers[id] = {
            timer:window.setInterval(function() {
                if (magnetic) {
                    successCallback(magnetic);
                }
            }, frequency),
            listeners:p
        };

        if (running) {
            // If we're already running then immediately invoke the success callback
            // but only if we have retrieved a value, sample code does not check for null ...
            if (magnetic) {
                successCallback(magnetic);
            }
        } else {
            start();
        }

        if (cordova.platformId === "browser" && !eventTimerId) {
            // Start firing devicemotion events if we haven't already
            var devicemagnetEvent = new Event('devicemagnet');
            eventTimerId = window.setInterval(function() {
                window.dispatchEvent(devicemagnetEvent);
            }, 200);
        }

        return id;
    },

    /**
     * Clears the specified magnetometer watch.
     *
     * @param {String} id       The id of the watch returned from #watch.
     */
    clearWatch: function(id) {
        // Stop javascript timer & remove from timer list
        if (id && timers[id]) {
            window.clearInterval(timers[id].timer);
            removeListeners(timers[id].listeners);
            delete timers[id];

            if (eventTimerId && Object.keys(timers).length === 0) {
                // No more watchers, so stop firing 'devicemotion' events
                window.clearInterval(eventTimerId);
                eventTimerId = null;
            }
        }
    }
};
module.exports = magnetometer;
