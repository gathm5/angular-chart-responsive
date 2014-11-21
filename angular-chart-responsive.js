'use strict';

(function () {

    Chart.defaults.global.responsive = true;
    Chart.defaults.global.multiTooltipTemplate = '<%if (datasetLabel){%><%=datasetLabel%>: <%}%><%= value %>';

    angular.module('angular-chart-responsive', [])
        .directive('chartBase', function () {
            return chart();
        })
        .directive('chartLine', function () {
            return chart('Line');
        })
        .directive('chartBar', function () {
            return chart('Bar');
        })
        .directive('chartRadar', function () {
            return chart('Radar');
        })
        .directive('chartDoughnut', function () {
            return chart('Doughnut');
        })
        .directive('chartPie', function () {
            return chart('Pie');
        })
        .directive('chartPolarArea', function () {
            return chart('PolarArea');
        })
        .provider('chartConfig', function chartConfigProvider() {
            return {
                setColor: function (color) {
                    Chart.defaults.global.colors.push(color);
                },
                $get: function () {
                    return Chart.defaults.global;
                }
            };
        });

    function chart(type) {
        return {
            restrict: 'CA',
            scope: {
                data: '=',
                labels: '=',
                options: '=',
                series: '=',
                colors: '=',
                chartType: '=',
                legend: '@',
                click: '=',
                settings: '='
            },
            link: function (scope, elem) {
                var chart, container = document.createElement('div');
                container.className = 'chart-container';
                elem.replaceWith(container);
                container.appendChild(elem[0]);

                scope.$watch('data', function (newVal, oldVal) {
                    if (!newVal || !newVal.length || (hasDataSets(type) && !newVal[0].length)) {
                        return;
                    }
                    var chartType = type || scope.chartType;
                    if (!chartType) {
                        return;
                    }

                    if (chart) {
                        if (canUpdateChart(chartType, newVal, oldVal)) {
                            return updateChart(chart, chartType, newVal, scope);
                        }
                        chart.destroy();
                    }

                    chart = createChart(chartType, scope, elem);
                }, true);

                scope.$watch('chartType', function (newVal) {
                    if (!newVal) {
                        return;
                    }
                    if (chart) {
                        chart.destroy();
                    }
                    chart = createChart(newVal, scope, elem);
                });
            }
        };
    }

    function canUpdateChart(type, newVal, oldVal) {
        if (newVal && oldVal && newVal.length && oldVal.length) {
            return hasDataSets(type) ?
                newVal.length === oldVal.length && newVal[0].length === oldVal[0].length :
                newVal.length === oldVal.length;
        }
        return false;
    }

    function createChart(type, scope, elem) {
        var cvs = elem[0], ctx = cvs.getContext('2d');
        var data = hasDataSets(type) ?
            getDataSets(scope.labels, scope.data, scope.series || [], scope.colors) :
            getData(scope.labels, scope.data, scope.colors);
        var chart = new Chart(ctx)[type](data, scope.options || {});
        if (scope.click) {
            cvs.onclick = function (evt) {
                if (chart.getPointsAtEvent || chart.getSegmentsAtEvent) {
                    var activePoints = hasDataSets(type) ? chart.getPointsAtEvent(evt) : chart.getSegmentsAtEvent(evt);
                    scope.click(activePoints, evt);
                }
            };
        }
        if (scope.legend) {
            setLegend(elem, chart);
        }
        return chart;
    }

    function setLegend(elem, chart) {
        var $parent = elem.parent(),
            $oldLegend = $parent.find('chart-legend'),
            legend = '<chart-legend>' + chart.generateLegend() + '</chart-legend>';
        if ($oldLegend.length) {
            $oldLegend.replaceWith(legend);
        }
        else {
            $parent.append(legend);
        }
    }

    function updateChart(chart, type, values, scope) {
        if (hasDataSets(type)) {
            chart.datasets.forEach(function (dataset, i) {
                if (scope.colors) {
                    updateColors(dataset, scope.colors[i]);
                }
                (dataset.points || dataset.bars).forEach(function (dataItem, j) {
                    dataItem.value = values[i][j];
                });
            });
        } else {
            chart.segments.forEach(function (segment, i) {
                segment.value = values[i];
                if (scope.colors) {
                    updateColors(segment, scope.colors[i]);
                }
            });
        }
        chart.update();
    }

    function updateColors(item, color) {
        item.fillColor = color.fillColor;
        item.highlightColor = color.highlightColor;
        item.strokeColor = color.strokeColor;
        item.pointColor = color.pointColor;
        item.pointStrokeColor = color.pointStrokeColor;
    }

    function hasDataSets(type) {
        return ['Line', 'Bar', 'Radar'].indexOf(type) > -1;
    }

    function getDataSets(labels, data, series, colors) {
        colors = colors || Chart.defaults.global.colors;
        return {
            labels: labels,
            datasets: data.map(function (item, i) {
                var dataSet = clone(colors[i]);
                dataSet.label = series[i];
                dataSet.data = item;
                return dataSet;
            })
        };
    }

    function clone(obj) {
        var newObj = {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                newObj[key] = obj[key];
            }
        }
        return newObj;
    }

    function getData(labels, data, colors) {
        colors = colors || Chart.defaults.global.colors;
        return labels.map(function (label, i) {
            return {
                label: label,
                value: data[i],
                color: colors[i].strokeColor,
                highlight: colors[i].pointHighlightStroke
            };
        });
    }

})();