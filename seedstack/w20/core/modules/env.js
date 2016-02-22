/*
 * Copyright (c) 2013-2015 by The SeedStack authors. All rights reserved.
 *
 * This file is part of SeedStack, An enterprise-oriented full development stack.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

define([
    'module',
    'w20',

    'jquery',
    '{lodash}/lodash',
    '{angular}/angular',

    '{w20-core}/modules/application',
    '{w20-core}/modules/security'
], function (module, w20, $, _, angular) {
    'use strict';

    /**
     * This module provides W20 base features and abstraction from its running environment. Development environment is automatically
     * set when global debug mode is active and no environment is specified.
     *
     * Configuration
     * -------------
     *
     *      "env" : {
     *          // Explicitly set the environment type (dev, test, preprod and prod are recognized special values).
     *          "type" : "the environment name"
     *      }
     *
     * Fragment definition sections
     * ----------------------------
     *
     * This module has no fragment definition section.
     *
     * @name w20CoreEnv
     * @module
     */
    var w20CoreEnv = angular.module('w20CoreEnv', [ 'w20CoreSecurity', 'w20CoreApplication' ]),
        config = module && module.config() || {};

    /**
     * The EnvironmentService provides access to running environment information.
     *
     * @name EnvironmentService
     * @memberOf w20CoreEnv
     * @w20doc service
     */
    w20CoreEnv.factory('EnvironmentService', function () {
        return {
            /**
             * The environment type. Any value is valid but those are recognized: dev, test, preprod, prod.
             *
             * @field
             * @name EnvironmentService#environment
             * @memberOf EnvironmentService
             * @type String
             */
            environment: config.type || 'prod'
        };
    });

    /**
     * The StateService provides key/value storage for data that needs to be persisted across sessions.
     *
     * @name StateService
     * @memberOf w20CoreEnv
     * @w20doc service
     */
    w20CoreEnv.factory('StateService', [ '$rootScope', '$log', '$window', 'ApplicationService', function ($rootScope, $log, $window, applicationService) {
        var states = {};

        return {
            /**
             * This function create a state object for a given (namespace, key) tuple. State objects are persisted accross
             * sessions, can have a default value when first initialized and provides methods for reading and writing the
             * state value :
             *
             * * state.value(theValue) : getter/setter for the state value. If theValue is present it sets the value of the state object, if not it returns the current value.
             * * state.save() : explicitely save the value (useful when altering inner properties of a complex object and not replacing the value instance).
             *
             * @function
             * @name StateService#state
             * @memberOf StateService
             * @param {String} namespace The namespace of the state.
             * @param {String} key The key of the state.
             * @param {String} defaultvalue The default value when the state is first initialized.
             * @return {Object} The state object.
             */
            state: function (namespace, key, defaultvalue) {
                if (typeof namespace === 'undefined') {
                    throw new Error('Module argument is required for using a state, got undefined');
                }
                if (typeof key === 'undefined') {
                    throw new Error('Key argument is required for using a state, got undefined');
                }

                var prefix = 'w20.state.' + applicationService.applicationId + '.' + namespace;

                if (typeof states[namespace] === 'undefined') {
                    states[namespace] = angular.fromJson($window.localStorage.getItem(prefix)) || {};
                }
                if (typeof states[namespace][key] === 'undefined') {
                    states[namespace][key] = defaultvalue;
                }

                return {
                    value: function (value) {
                        if (typeof value === 'undefined') {
                            return states[namespace][key];
                        }
                        else {
                            states[namespace][key] = value;
                            $window.localStorage.setItem(prefix, angular.toJson(states[namespace]));
                            return undefined;
                        }
                    },

                    save: function () {
                        $window.localStorage.setItem(prefix, angular.toJson(states[namespace]));
                    }
                };
            },

            /**
             * This function returns all the state keys for a given namespace.
             *
             * @function
             * @name StateService#keys
             * @memberOf StateService
             * @param {String} namespace The namespace of the state to retrieve the keys from.
             * @return {String[]} The list of keys for all stored states in the namespace.
             */
            keys: function (namespace) {
                if (typeof namespace === 'undefined') {
                    throw new Error('Module argument is required for using all states, got undefined');
                }

                if (typeof states[namespace] === 'undefined') {
                    states[namespace] = $window.localStorage.getItem('w20.state.' + applicationService.applicationId + '.' + namespace) || {};
                }

                return _.keys(states[namespace]);
            }
        };
    } ]);

    /**
     * The PreferencesService provides an abstraction over the StateService dedicated to application preference storage.
     *
     * @name PreferencesService
     * @memberOf w20CoreEnv
     * @w20doc service
     */
    w20CoreEnv.factory('PreferencesService', [ 'StateService',
        function (stateService) {
            var preferences = {}, icons = {}, meta = {};

            return {
                /**
                 * Getter/setter for the icon of a preference category.
                 *
                 * @function
                 * @name PreferencesService#icon
                 * @memberOf PreferencesService
                 * @param {String} category The preference category.
                 * @param {String} icon The type of the icon (i.e. the CSS class of the icon) to set.
                 * @return {String} The type of the icon if used as a getter, the previous type of icon if used as a setter.
                 */
                icon: function (category, icon) {
                    if (typeof icon === 'undefined') {
                        return icons[category];
                    }

                    var previous = icons[category];
                    icons[category] = icon;
                    return previous;
                },

                /**
                 * Defines a typed preference object for a given (category, name) tuple. A preference object provides the following methods :
                 *     * pref.value(theValue) : getter/setter for the preference value. If theValue is present it sets the value of the preference object, if not it returns the current value.
                 *     * pref.meta(theMetadataObject) : getter/setter for the preference metadata object. A preference metadata object can contain anything but the 'callback' property is used as a function to call when the preference value has been set.
                 *
                 * @function
                 * @name PreferencesService#preference
                 * @memberOf PreferencesService
                 * @param {String} category The preference category.
                 * @param {String} name The preference name.
                 * @param {String} defaultvalue The default value when the preference is first initialized.
                 * @param {String} type The data type of the preference. If omitted <code>typeof defaultvalue</code> is used instead.
                 * @return {Object} The preference object.
                 */
                preference: function (category, name, defaultvalue, type) {
                    var modPrefsState = stateService.state('preferences', 'pref-' + category, {});
                    var modPrefs = modPrefsState.value();

                    if (typeof modPrefs[name] === 'undefined' && typeof defaultvalue !== 'undefined') {
                        modPrefs[name] = {
                            module: category,
                            name: name,
                            value: defaultvalue,
                            type: type || typeof defaultvalue
                        };
                        modPrefsState.save();
                    }

                    return {
                        value: function (value) {
                            var thePref = modPrefs[name];

                            if (typeof value === 'undefined') {
                                if (typeof thePref === 'undefined') {
                                    return undefined;
                                }
                                return thePref.value;
                            }
                            else {
                                var oldValue = thePref.value, theMeta = this.meta();
                                thePref.value = value;
                                modPrefsState.save();

                                if (typeof theMeta !== 'undefined' && typeof theMeta.callback === 'function' && value !== oldValue) {
                                    theMeta.callback(value, oldValue);
                                }
                                return undefined;
                            }
                        },
                        meta: function (value) {
                            if (typeof value === 'undefined') {
                                return (meta[category] || {})[name] || {};
                            }

                            if (typeof meta[category] === 'undefined') {
                                meta[category] = {};
                            }
                            meta[category][name] = value;
                            return undefined;
                        }
                    };
                },

                /**
                 * Returns all the preferences for a given category.
                 *
                 * @function
                 * @name PreferencesService#preferences
                 * @memberOf PreferencesService
                 * @param {String} category The preference category.
                 * @return {Object} An object containing all the preference from the given category.
                 */
                preferences: function (category) {
                    if (typeof category === 'undefined') {
                        var result = {}, prefs = stateService.keys('preferences');
                        for (var i = 0; i < prefs.length; i++) {
                            if (prefs[i].indexOf('pref-') === 0) {
                                result[prefs[i].substring(5)] = stateService.state('preferences', prefs[i]).value();
                            }
                        }
                        return result;
                    }

                    return stateService.state('preferences', 'pref-' + category).value();
                }
            };
        }
    ]);

    /**
     * The EventService provides functions to emit and listen to application-wide events. Behind the scenes the EventService,
     * uses AngularJS events on the root scope.
     *
     * @name EventService
     * @memberOf w20CoreEnv
     * @w20doc service
     */
    w20CoreEnv.factory('EventService', [ '$rootScope', '$injector', function ($rootScope, $injector) {
        var viewListeners = [];

        $rootScope.$on('$routeChangeSuccess', function () {
            _.each(viewListeners, function (listener) {
                listener(); // deregister the view scoped listener
            });
            viewListeners.length = 0;
        });

        return {
            /**
             * Broadcast an application-wide event.
             *
             * @function
             * @name EventService#broadcast
             * @memberOf EventService
             * @param {String} eventType The type of the event.
             * @param {String} args The arguments of the event (which will be passed to any listener function).
             */
            broadcast: function (eventType, args) {
                $rootScope.$broadcast(eventType, args);
            },

            /**
             * Emit an application-wide event.
             *
             * @function
             * @name EventService#emit
             * @memberOf EventService
             * @param {String} eventType The type of the event.
             * @param {String} args The arguments of the event (which will be passed to any listener function).
             */
            emit: function (eventType, args) {
                $rootScope.$emit(eventType, args);
            },

            /**
             * Register a listener for a given type of event. Listeners have a scope :
             *     * Application scope (by default or 'application' as the listenerScope argument). The listener will live for the duration of the application. No automatic deregistration will be done.
             *     * View scope ('view' as listenerScope argument). The listener will live for the duration of the current view. On view change, it will be automatically deregistered.
             *
             * @function
             * @name EventService#on
             * @memberOf EventService
             * @param {String} eventType The type of the event.
             * @param {String} listener A function that will be called upon event reception.
             * @param {String} listenerScope The scope of the listener.
             * @return {Function} The listener deregistration function.
             */
            on: function (eventType, listener, listenerScope) {
                var deregisterFn;

                if (typeof listener === 'function') {
                    deregisterFn = $rootScope.$on(eventType, function () {
                        listener.apply({}, Array.prototype.slice.call(arguments, 1));
                    });
                } else if (typeof listener === 'object') {
                    deregisterFn = $rootScope.$on(eventType, function () {
                        $injector.invoke(listener, {}, {
                            $event: arguments[0],
                            $args: Array.prototype.slice.call(arguments, 1)
                        });
                    });
                } else {
                    throw new Error('event listener must be a function or an injection array, got ' + typeof listener);
                }

                if (listenerScope === 'view') {
                    viewListeners.push(deregisterFn);
                }

                return deregisterFn;
            }
        };
    } ]);

    /**
     * The ConnectivityService provides functions to query and check the connectivity state of the application. An application
     * can have three connectivity state :
     *     * online : the application is connected to the network and can access its own server.
     *     * offline : the application is not connected to the network or cannot access its own server.
     *     * unknown : the application connectivity state is unknown.
     *
     * @name ConnectivityService
     * @memberOf w20CoreEnv
     * @w20doc service
     */
    w20CoreEnv.factory('ConnectivityService', [ '$window', '$log', 'EventService', function ($window, $log, eventService) {
        var beforeSendTime, lastState = {
            httpStatus: undefined,
            online: undefined,
            latency: undefined,
            changed: false
        };

        var doCheck = function (callback) {
            var req = $.ajax({
                type: 'HEAD',
                url: $window.location.href.split('?')[0] + '?' + Math.random(),
                beforeSend: function () {
                    beforeSendTime = new Date().getTime();
                },
                cache: false,
                timeout: 2000
            }).done(function () {
                var online = req.status >= 200 && req.status < 300 || req.status === 304;
                var state = {
                    httpStatus: req.status,
                    online: online,
                    latency: new Date().getTime() - beforeSendTime,
                    changed: typeof lastState.online !== 'undefined' && lastState.online !== online
                };

                lastState = state;

                if (typeof callback !== 'undefined') {
                    callback(state);
                }

                eventService.emit('w20.env.connectivity.online', state);
            }).fail(function () {
                var state = {
                    httpStatus: req.status,
                    online: false,
                    latency: Infinity,
                    changed: typeof lastState.online !== 'undefined' && lastState.online !== false
                };

                lastState = state;

                if (typeof callback !== 'undefined') {
                    callback(state);
                }

                eventService.emit('w20.env.connectivity.offline', state);
            });
        };

        return {
            /**
             * Explicitely check for application connectivity.
             *
             * @function
             * @name ConnectivityService#check
             * @memberOf ConnectivityService
             * @param {Function} callback The function to be called after the connectivity check.
             */
            check: function (callback) {
                doCheck(function (connectivity) {
                    if (connectivity.changed) {
                        $log.info('application is now ' + (connectivity.online ? 'online' : 'offline'));
                    }
                    if (typeof callback === 'function') {
                        callback(connectivity);
                    }
                });
            },

            /**
             * Return the last known state of the application connectivity.
             *
             * @function
             * @name ConnectivityService#state
             * @memberOf ConnectivityService
             * @return {Object}. The last known state of application connectivity : { httpStatus: (Integer), online: (Boolean), latency: (Integer in ms), changed: (Boolean) }.
             */
            state: function () {
                return lastState;
            }
        };
    } ]);

    w20CoreEnv.run([ 'ConnectivityService', '$window', '$injector', '$rootScope', function (connectivityService, $window, $injector, $rootScope) {

        w20.injector = $injector;

        Object.getPrototypeOf($rootScope).$safeApply = function (fn) {
            fn = fn || function () {
            };
            if (this.$$phase) {
                fn();
            }
            else {
                this.$apply(fn);
            }
        };

        $($window).on('online', function () {
            $window.setTimeout(connectivityService.check, 5000);
        });
        $($window).on('offline', function () {
            $window.setTimeout(connectivityService.check, 5000);
        });

        connectivityService.check();
    } ]);

    return {
        angularModules: [ 'w20CoreEnv' ]
    };
});
