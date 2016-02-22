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
    'require',
    'jquery',
    '{angular}/angular',
    '{w20-core}/modules/application',
    '{showdown}/showdown',
    '{w20-core}/modules/utils'
], function (_require, $, angular, w20CoreApplication, Showdown) {
    'use strict';

    /**
     * This module provides text services and directives for publishing content.
     *
     * Configuration
     * -------------
     *
     * This module has no configuration option.
     *
     * Fragment definition sections
     * ----------------------------
     *
     * This module has no fragment definition section.
     *
     * @name w20UIText
     * @module
     */
    var w20UIText = angular.module('w20UIText', [ 'w20CoreUtils' ]);

    /**
     * This service provides various text manipulation functions.
     *
     * @name TextService
     * @memberOf w20UIText
     * @w20doc service
     */
    w20UIText.factory('TextService', [function() {
        var converter = new Showdown.converter(),
            placeholderRegexp = new RegExp('(src|href)="(.*{.+}[^"]*)"', 'g');


        return {
            /**
             * Convert markdown text to html.
             *
             * @function
             * @name TextService#markdown
             * @memberOf TextService
             * @param {String} value The markdown text to convert.
             * @return {String} The HTML text converted.
             */
            markdown: function(value) {
                return converter.makeHtml(value).replace(placeholderRegexp, function (all, attr, link) {
                    return attr + '="' + _require.toUrl(link) + '"';
                });
            }
        };
    }]);

    /**
     * This directive converts the element markdown content to HTML.
     *
     * @name w20Markdown
     * @w20doc directive
     * @memberOf w20UIText
     */
    w20UIText.directive('w20Markdown', ['TextService', 'EventService', function (textService, eventService) {
        return {
            replace: false,
            transclude: false,
            restrict: 'EA',
            scope: false,
            link : function(scope, iElement, iAttrs) {
                if (iAttrs.w20Markdown !== '') {
                    $.ajax({
                        url: scope.$eval(iAttrs.w20Markdown),
                        dataType: 'text',
                        success: function (data) {
                            iElement.html(textService.markdown(data));
                            eventService.emit('w20.publishing.text.markdown-rendered', iElement);

                            if (iAttrs.onload) {
                                scope.$apply(function () {
                                    scope.$eval(iAttrs.onload);
                                });
                            }
                        },
                        error: function () {
                            iElement.html('');
                        }
                    });
                } else {
                    iElement.html(textService.markdown(iElement.html()));
                }
            }
        };
    }]);

    /**
     * This filter convert the input string from markdown text to HTML.
     * It takes no argument.
     *
     * @name markdown
     * @w20doc filter
     * @memberOf w20UIText
     */
    w20UIText.filter('markdown', ['TextService', function (textService) {
        return function(value) {
            if (value) {
                return textService.markdown(value);
            }
        };
    }]);

    w20CoreApplication.registerRouteHandler('markdown', function(route) {
        route.template = '<div class="container-fluid"><div class="row-fluid"><div data-w20-markdown="currentRoute.url | path"></div></div></div>';
        delete route.templateUrl;

        return route;
    });

    return {
        angularModules:[ 'w20UIText' ]
    };
});
