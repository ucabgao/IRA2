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
    '{angular}/angular',
    '{d3}/d3',
    '{nvd3}/nv.d3',
    '{w20-dataviz}/modules/charts/common',
    '[css]!{nvd3}/nv.d3'
], function (angular, d3, nv, common) {
    'use strict';

    /**
     * The multibar horizontal chart is used to compare different series in a horizontal bar representation.
     *
     * Configuration
     * -------------
     *
     *      "multibarhorizontal":{},
     *
     * Fragment definition sections
     * ----------------------------
     *
     * This module has no fragment definition section.
     *
     *
     * Data format
     * ---------------
     *
     * Data fed to the multibar horizontal chart should follow a default format. This format can be overridden by the use of personal function (See "x" and "y" properties below).
     *
     * Default data format exemple :
     *
     *      [
     *       {
     *          "key": "Series 1",
     *          "values": [ [1, 10], [2, 20], [3, 5] ]
     *       },
     *       {
     *          "key": "Series 2",
     *          "values": [ [1, 8], [2, 10], [3, 15] ]
     *       }
     *      ]
     *
     * The <code>key</code> property defines the name of the series. The <code>values</code> defines the data of the series. By default the value at index 0 of each sub array is plotted on the X axis while the value at index 1 is plotted on the Y axis.
     *
     *
     * Multibar configuration
     * ---------------
     *
     * The multibar chart is configured by the configuration object passed to the directive declaration (see Directives).
     *
     *  Exemple :
     *
     *        $scope.multibarHorizontalConfig = {
     *               data: $scope.multibarhorizontaldata,
     *               showXAxis: true,
     *               showYAxis: true,
     *               tooltips: true,
     *               showControls: true,
     *               showLegend: true
     *         }
     *
     * Available properties :
     *
     * <table style="width: 100%; text-align: left;" class="table table-striped table-bordered table-condensed">
     *    <thead>
     *        <tr>
     *            <th>Properties</th>
     *            <th>Type</th>
     *            <th>Description</th>
     *        </tr>
     *    </thead>
     *    <tbody>
     *        <tr>
     *            <td>data</td>
     *            <td>Array</td>
     *            <td>Data to display using the multibar horizontal chart (mandatory if you don't define the "noData" property.). Generally it would be a property of $scope</td>
     *        </tr>
     *        <tr>
     *            <td>x</td>
     *            <td>function</td>
     *            <td>Providing a function to the x property allows configuration of the data on the X axis. Consider this example : say we want to double the data value displayed on the X axis in comparison to the data provided to the "data" property.
     *            We can achieve this by providing the following function to the x property :
     *            <code>function(){
     *                       return function(d){
     *                            return d[0]*2;
     *                        };
     *                   };
     *            </code>
     *              where "d[0]" is all the values at index 0 of all sub arrays of the array at property "values" of all objects in the array provided to the "data" property.
     *            </td>
     *        </tr>
     *        <tr>
     *            <td>y</td>
     *            <td>function</td>
     *            <td>See "x" property above. Applied to the Y axis instead.</td>
     *        </tr>
     *        <tr>
     *            <td>forceY</td>
     *            <td>Array</td>
     *            <td>Values to force on the Y axis. By default the Y axis will start at the minimum value of the serie. Use it to force special values such as 0.</td>
     *        </tr>
     *        <tr>
     *            <td>showLegend</td>
     *            <td>Boolean</td>
     *            <td>Display or hide legend.</td>
     *        </tr>
     *        <tr>
     *            <td>showControls</td>
     *            <td>Boolean</td>
     *            <td>Display or hide controls.</td>
     *        </tr>
     *        <tr>
     *            <td>tooltips</td>
     *            <td>Boolean</td>
     *            <td>Enable or disable tooltips when hovering the chart.</td>
     *        </tr>
     *          <tr>
     *            <td>noData</td>
     *            <td>String</td>
     *            <td>Message to display when there is no data (default to "No data available") </td>
     *        </tr>
     *          <tr>
     *            <td>color</td>
     *            <td>Array</td>
     *            <td> Color of series in the corresponding order. Can be hexadecimal, named  or RGB. Ex.  <code>['#4D9FF2', 'yellow', 'rgb(151,109,165)']</code>. Note that you can also
     *            specify the value of the color in the "data" array by providing a "color" attribute to each object. </td>
     *        </tr>
     *         <tr>
     *            <td>stacked</td>
     *            <td>Boolean</td>
     *            <td>Indicate whether the series should be stacked on each other or not. </td>
     *        </tr>
     *           <tr>
     *            <td> tooltipContent</td>
     *            <td>function</td>
     *            <td>Customize tooltip content. Ex. <code> function(key, x, y, e, graph) { return '&lth1&gt Tooltip Title &lt/h1&gt &ltp&gt'+ y +'&lt/p&gt';} </code>
     *            where key, x and y are the name and value of the series at the tooltip point, e an event and graph the chart object.</td>
     *        </tr>
     *         <tr>
     *            <td>transitionDuration</td>
     *            <td>integer</td>
     *            <td>Duration of transition effect (Default to 500).</td>
     *        </tr>
     *
     *
     *    </tbody>
     * </table>
     *
     *
     * Axis Configuration
     * -----------------------
     *
     * Axis are configured in the same configuration object.
     *
     * X axis :
     *
     *  <table style="width: 100%; text-align: left;" class="table table-striped table-bordered table-condensed">
     *    <thead>
     *        <tr>
     *            <th>Properties</th>
     *            <th>Type</th>
     *            <th>Description</th>
     *        </tr>
     *    </thead>
     *    <tbody>
     *        <tr>
     *            <td>xAxisTickValues</td>
     *            <td>Array</td>
     *            <td> Specify explicitly the values to plot on the X axis</td>
     *        </tr>
     *         <tr>
     *            <td>xAxisTickSubdivide</td>
     *            <td>Integer</td>
     *            <td> Specify the number of intermediate ticks to show on the X axis </td>
     *        </tr>
     *         <tr>
     *            <td>xAxisTickPadding</td>
     *            <td>Integer</td>
     *            <td>Specify ticks padding on the X axis</td>
     *        </tr>
     *         <tr>
     *            <td>xAxisTickFormat</td>
     *            <td>function</td>
     *            <td> Specify how data should be formatted. For instance you can format number on the X axis to
     *            have exactly two digit after the decimal point : <code> d3.format('.2f')</code>. Or format Date object to
     *            a readable format as <code> d3.time.format('%Y')</code> which shows the year only. See
     *            <a href="https://github.com/mbostock/d3/wiki/Formatting" target="_blank">d3.js documentation</a>
     *            for a list of all format available
     *            </td>
     *        </tr>
     *         <tr>
     *            <td>xAxisLabel</td>
     *            <td>String</td>
     *            <td>Label of the X axis</td>
     *        </tr>
     *         <tr>
     *            <td>xAxisDomain</td>
     *            <td>Array [start, end]</td>
     *            <td> Specify the domain on the X axis (min to max value)</td>
     *        </tr>
     *         <tr>
     *            <td>xAxisShowMaxMin</td>
     *            <td>Boolean</td>
     *            <td> Show or hide maximum and minimum value in bold</td>
     *        </tr>
     *        <tr>
     *            <td>xAxisRotateLabels</td>
     *            <td>Integer</td>
     *            <td> 0 to 180° rotation of X axis tick label</td>
     *        </tr>
     *         <tr>
     *            <td>xAxisStaggerLabels</td>
     *            <td>Integer</td>
     *            <td>Size of the gap between labels to resolve overlapping issue</td>
     *        </tr>
     *
     *    </tbody>
     *  </table>
     *
     *  Y axis :
     *
     *  See X axis. Replace property "xName" by "yName".
     *
     *
     * @name w20DatavizCharts
     * @w20doc module
     */

    /**
     * The w20MultiBarHorizontalChart directive allows you to declare the chart on your html markup and specify the configuration object to be used in your controller.
     * <div class="alert alert-info"> You must indicate a unique id for the chart </div>
     *
     *     <div id="multibarhorizontal" data-w20-multi-bar-horizontal-chart="multibarHorizontalConfig"></div>
     *
     *
     *
     *
     * @name w20MultibarHorizontalChart
     * @memberOf w20DatavizCharts
     * @w20doc directive
     *
     *
     */

    common.ngModule.directive('w20MultiBarHorizontalChart', [function () {
        return {
            restrict: 'A',
            scope: {
                config: '=w20MultiBarHorizontalChart'
            },
            template: '<svg></svg>',
            link: function (scope, element, attrs) {
                scope.$watch('config.data', function (data) {
                    if (data) {
                        //if the chart exists on the scope, do not call addGraph again, update data and call the chart.
                        if (scope.chart) {
                            return d3.select('#' + attrs.id + ' svg')
                                .datum(data)
                                .call(scope.chart);
                        }
                        nv.addGraph({
                            generate: function () {
                                var margin = (scope.$eval(scope.config.margin) || {left: 50, top: 50, bottom: 50, right: 50}),
                                    width = scope.config.width,
                                    height = scope.config.height;
                                var chart = nv.models.multiBarHorizontalChart()
                                    .margin(margin)
                                    .x(scope.config.x === undefined ? function (d) {
                                        return d[0];
                                    } : scope.config.x)
                                    .y(scope.config.y === undefined ? function (d) {
                                        return d[1];
                                    } : scope.config.y)
                                    .forceY(scope.config.forceY === undefined ? [0] : scope.$eval(scope.config.forceY))
                                    .width(width)
                                    .height(height)
                                    .tooltips(scope.config.tooltips === undefined ? false : scope.config.tooltips)
                                    .noData(scope.config.noData === undefined ? 'No Data Available.' : scope.config.noData)
                                    .color(scope.config.color === undefined ? nv.utils.defaultColor() : scope.config.color)
                                    .showLegend(scope.config.showLegend === undefined ? false : scope.config.showLegend)
                                    .showControls(scope.config.showControls === undefined ? false : scope.config.showControls)
                                    .showValues(scope.config.showValues === undefined ? false : scope.config.showValues)
                                    .stacked(scope.config.stacked === undefined ? false : scope.config.stacked);

                                common.configureXaxis(chart, scope);
                                common.configureYaxis(chart, scope);

                                if (scope.config.tooltipContent) {
                                    chart.tooltipContent(scope.config.tooltipContent);
                                }

                                if (scope.config.valueFormat) {
                                    chart.valueFormat(scope.config.valueFormat());
                                }

                                var drawChart = function () {
                                    d3.select('#' + attrs.id + ' svg')
                                        .attr('height', height)
                                        .attr('width', width)
                                        .datum(data)
                                        .transition().duration((scope.config.transitionDuration === undefined ? 500 : scope.config.transitionDuration))
                                        .call(chart);
                                };

                                drawChart();
                                element.on('resize', function () {
                                    drawChart();
                                });

                                scope.chart = chart;
                                return chart;
                            }
                        });
                    }
                }, (scope.config.objectequality === undefined ? false : scope.config.objectequality));
            }
        };
    }]);


    return {
        angularModules: [ common.ngModuleName ]
    };
});

