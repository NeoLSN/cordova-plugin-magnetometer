Cordova Magnetometer Plugin
========

Description
--------

This project provides an Angular module called `deviceMagnetometer`.

Installation
--------

```bash
cordova plugin add https://github.com/NeoLSN/cordova-plugin-magnetometer
```

Usage
--------

### API

```javascript
var magnetometer = navigator.magnetometer;
magnetometer.getCurrent
magnetometer.watch
magnetometer.clearWatch
```

### For Angular

1. Copy `deviceMagnetometer.js` to your project folder.
2. Add `deviceMagnetometer` as a module.

```javascript
angular
  .module(
    'app', [
      ... other modules
      'deviceMagnetometer'
    ]
  )
```
3. Inject `$deviceMagnetometer` in controller. It's return a promise.
```javascript
$deviceMagnetometer.getCurrent()
$deviceMagnetometer.watch()
$deviceMagnetometer.clearWatch()
```
