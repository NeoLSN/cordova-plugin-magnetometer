angular
  .module('deviceMagnetometer', [])
  .factory('$deviceMagnetometer', ['$q', function($q) {

    return {
      getCurrent: function() {
        var q = $q.defer();

        if (angular.isUndefined(navigator.magnetometer) ||
          !angular.isFunction(navigator.magnetometer.getCurrent)) {
          q.reject('Device do not support watch');
        }

        navigator.magnetometer.getCurrent(function(result) {
          q.resolve(result);
        }, function(err) {
          q.reject(err);
        });

        return q.promise;
      },

      watch: function(options) {
        var q = $q.defer();

        if (angular.isUndefined(navigator.magnetometer) ||
          !angular.isFunction(navigator.magnetometer.watch)) {
          q.reject('Device do not support watchMagnetometer');
        }

        var watchID = navigator.magnetometer.watch(function(result) {
          q.notify(result);
        }, function(err) {
          q.reject(err);
        }, options);

        q.promise.cancel = function() {
          navigator.magnetometer.clearWatch(watchID);
        };

        q.promise.clearWatch = function(id) {
          navigator.magnetometer.clearWatch(id || watchID);
        };

        q.promise.watchID = watchID;

        return q.promise;
      },

      clearWatch: function(watchID) {
        return navigator.magnetometer.clearWatch(watchID);
      }
    };
  }]);
