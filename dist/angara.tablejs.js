(function(window, undefined) {
(function(factory) {
	// Define as an AMD module if possible
	if ( typeof define === 'function' && define.amd )
	{
	    define( ['jquery', 'idd', 'jquery.dataTables', 'css!jquery.dataTables-css', 'css!idd-css', 'css!angara.tablejs'], function($, Charting){
			var TableViewer = factory ({}, $, Charting.InteractiveDataDisplay);
			return TableViewer;
		});
	}
	/* Define using browser globals otherwise
	 */
	else if ( window.jQuery && window.InteractiveDataDisplay )
	{
		window.TableViewer = factory({}, window.jQuery, window.InteractiveDataDisplay );
	}
})
(function(TableViewer, $, InteractiveDataDisplay){ // factory, returns "TableViewer"

(function (TableViewer) {

    TableViewer.MathUtils = typeof (TableViewer.MathUtils) === 'undefined' ? {} : TableViewer.MathUtils;

    TableViewer.MathUtils.escapeHtml = function (s) {
        var t = typeof s;
        if (s == null || t === "number" || t === "undefined") return s;

        return s.toString().replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
            return '&#' + i.charCodeAt(0) + ';';
        });
    }

    TableViewer.MathUtils.power10 = function (p) {
        if (p >= 0) {
            var n = 1;
            for (var i = 0; i < p; i++)
                n *= 10;
            return n;
        } else {
            var n = 1.0;
            for (var i = 0; i < -p; i++)
                n *= 0.1;
            return n;
        }
    }

    TableViewer.MathUtils.getPrintFormat = function (min, max, std) {
        var extraPrec = 2;
        var posmax = Math.max(Math.abs(min), Math.abs(max));
        if (posmax === Infinity || std === Infinity || std === -Infinity || isNaN(posmax) || isNaN(std)) {
            return {
                toString: function (x) {
                    return x;
                }
            };
        }
        var log10 = Math.LN10;
        var p = posmax > 1e-12 ? Math.log(posmax) / log10 : 0;
        var alpha;
        if (std > 1e-12)
            alpha = Math.floor(Math.log(std) / log10) - extraPrec;
        else
            alpha = Math.floor(p - extraPrec);

        if (alpha < 0) { // i.e. nnnnn.ffff___
            var p2 = Math.floor(p);
            if (alpha <= -2 && p2 <= -4) { // 0.0000nn___  ->  0.nn x 10^-mmm
                var c1 = this.power10(-p2);
                return {
                    toString: function (x) {
                        return (x * c1).toFixed(-alpha + p2);
                    },

                    exponent: p2
                };
            }
            else // nnnnn.nn__ -> nnnnn.nn
                return {
                    toString: function (x) {
                        return x.toFixed(-alpha);
                    }
                };
        }
        else { // alpha >=0, i.e. nnnn___.___               
            if (alpha >= 2 && p > 5) { // nnnnnn.___  ->  nnnn x 10^mmm
                var c1 = this.power10(-alpha - extraPrec);
                return {
                    toString: function (x) {
                        return (x * c1).toFixed(extraPrec);
                    },

                    exponent: alpha + extraPrec
                };
            }
            else // alpha in [0,2), p in [alpha, 5], i.e. nnnnn.___ -> nnnnn.
                return {
                    toString: function (x) {
                        var y = x.toFixed();
                        if (x != y) y += ".";
                        return y;
                    }
                };
        }
    }
}(TableViewer));
(function (TableViewer, InteractiveDataDisplay, $, undefined) {
    TableViewer.BoxPlot = function (jqDiv, master) {
        this.base = InteractiveDataDisplay.CanvasPlot;
        this.base(jqDiv, master);

        var _l95, _r95, _l68, _r68, _median, _min, _max;
        var _height;
        var _thickness = 1;
        var _stroke = 'black';

        this.draw = function (data) {
            _l95 = data.l95;
            _r95 = data.r95;
            _l68 = data.l68;
            _r68 = data.r68;
            _median = data.median;
            _min = data.min;
            _max = data.max;
            _height = data.height;

            this.invalidateLocalBounds();

            this.requestNextFrameOrUpdate();
            this.fireAppearanceChanged();
        };

        // Returns a rectangle in the plot plane.
        this.computeLocalBounds = function () {
            return undefined;
        };

        // Returns 4 margins in the screen coordinate system
        this.getLocalPadding = function () {
            var padding = 0;
            return { left: padding, right: padding, top: padding, bottom: padding };
        };

        this.renderCore = function (plotRect, screenSize) {
            var t = this.getTransform();
            var dataToScreenX = t.dataToScreenX;
            var dataToScreenY = t.dataToScreenY;

            var context = this.getContext(true);
            context.beginPath();
            context.strokeStyle = _stroke;

            // Horizontal line
            var xmin_s = dataToScreenX(_min);
            var xmax_s = dataToScreenX(_max);
            var xl68_s = dataToScreenX(_l68);
            var xl95_s = dataToScreenX(_l95);
            var xr68_s = dataToScreenX(_r68);
            var xr95_s = dataToScreenX(_r95);
            var xmedian_x = dataToScreenX(_median);

            var yc_s = dataToScreenY(0);
            var yt_s = yc_s - _height / 2;
            var yb_s = yc_s + _height / 2;

            var yt2_s = yc_s - _height / 6;
            var yb2_s = yc_s + _height / 6;

            var rad = 5;

            context.moveTo(xl95_s, yc_s);
            context.lineTo(xl68_s, yc_s);
            context.moveTo(xr95_s, yc_s);
            context.lineTo(xr68_s, yc_s);

            context.moveTo(xmedian_x, yt_s);
            context.lineTo(xmedian_x, yb_s);

            context.moveTo(xl95_s, yt2_s);
            context.lineTo(xl95_s, yb2_s);

            context.moveTo(xr95_s, yt2_s);
            context.lineTo(xr95_s, yb2_s);
            context.stroke();

            context.strokeRect(xl68_s, yt_s, xr68_s - xl68_s, _height);

            context.beginPath();
            context.arc(xmin_s, yc_s, rad, 0, 2 * Math.PI);
            context.stroke();
            context.beginPath();
            context.arc(xmax_s, yc_s, rad, 0, 2 * Math.PI);
            context.stroke();
        }
    };
    TableViewer.BoxPlot.prototype = new InteractiveDataDisplay.CanvasPlot;

    $(document).ready(function () {
        InteractiveDataDisplay.register('boxplot', function (jqDiv, master) { return new TableViewer.BoxPlot(jqDiv, master); });
    });
}(TableViewer, InteractiveDataDisplay, $));
(function (TableViewer, InteractiveDataDisplay, $, undefined) {
    TableViewer.SelectedCellPlot = function (jqDiv, master) {
        this.base = InteractiveDataDisplay.CanvasPlot;
        this.base(jqDiv, master);

        var x, y, n;

        this.draw = function (data) {
            this.x = data.x;
            this.y = data.y;
            this.n = data.n;
            this.requestNextFrameOrUpdate();
        }

        this.renderCore = function (plotRect, screenSize) {
            var context = this.getContext(true);
            if (this.y >= 0 && this.x >= 0) {
                context.strokeStyle = "black";

                var t = this.getTransform();
                var dataToScreenX = t.dataToScreenX;
                var dataToScreenY = t.dataToScreenY;
                var hs1 = t.dataToScreenY(this.y);
                var hs2 = t.dataToScreenY(this.y + 1);
                var ws1 = t.dataToScreenX(this.x);
                var ws2 = t.dataToScreenX(this.x + 1);
                context.strokeRect(ws1, hs1, ws2 - ws1, hs2 - hs1);

                var n = this.n;
                hs1 = t.dataToScreenY(n - this.x - 1);
                hs2 = t.dataToScreenY(n - this.x);
                ws1 = t.dataToScreenX(n - this.y - 1);
                ws2 = t.dataToScreenX(n - this.y);
                context.strokeRect(ws1, hs1, ws2 - ws1, hs2 - hs1);
            }
        }
    };

    TableViewer.SelectedCellPlot.prototype = new InteractiveDataDisplay.CanvasPlot;

    $(document).ready(function () {
        InteractiveDataDisplay.register('selectedCell', function (jqDiv, master) { return new TableViewer.SelectedCellPlot(jqDiv, master); });
    });
}(TableViewer, InteractiveDataDisplay, $));
(function (TableViewer, InteractiveDataDisplay, $, undefined) {
    TableViewer.PiesMarker = {
        prepare : function(data) {
            // y
            if(data.y == undefined || data.y == null) throw "The mandatory property 'y' is undefined or null";
            if(!InteractiveDataDisplay.Utils.isArray(data.y)) throw "The property 'y' must be an array of numbers";                
            var n = data.y.length;
            
            var mask = new Int8Array(n);
            InteractiveDataDisplay.Utils.maskNaN(mask, data.y);               
            
            // x
            if(data.x == undefined || data.x == null)  throw "The mandatory property 'x' is undefined or null";
            else if (!InteractiveDataDisplay.Utils.isArray(data.x)) throw "The property 'x' must be an array of numbers";  
            else if (data.x.length != n) throw "Length of the array which is a value of the property 'x' differs from lenght of 'y'"
            else InteractiveDataDisplay.Utils.maskNaN(mask, data.x);  

            if(InteractiveDataDisplay.Utils.isArray(data.color)) {
                if(data.color.length != n) throw "Length of the array 'color' is different than length of the array 'y'"            
                var palette = data.colorPalette;
                if (palette != undefined && palette.isNormalized) {
                    var r = InteractiveDataDisplay.Utils.getMinMax(data.color);
                    r = InteractiveDataDisplay.Utils.makeNonEqual(r);
                    data.colorPalette = palette = palette.absolute(r.min, r.max);
                }
                var colors = new Array(n);
                for (var i = 0; i < n; i++){
                    var color = data.color[i];
                    if(color != color) // NaN
                        mask[i] = 1;
                    else {
                        var rgba = palette.getRgba(color);                        
                        colors[i] = "rgba(" + rgba.r + "," + rgba.g + "," + rgba.b + "," + rgba.a + ")";
                    }
                }
                data.color = colors;
            }

            // Filtering out missing values
            var m = 0;
            for(var i = 0; i < n; i++) if(mask[i] === 1) m++;            
            if(m > 0){ // there are missing values
                m = n - m; 
                data.x = InteractiveDataDisplay.Utils.applyMask(mask, data.x, m);
                data.y = InteractiveDataDisplay.Utils.applyMask(mask, data.y, m);
                data.color = InteractiveDataDisplay.Utils.applyMask(mask, data.color, m);
            }
        },

        // marker:
        // x, y is a center of a circle
        // radius 
        // value (between -1 and 1) -> angle
        // color
        // colorPalette
        draw: function (marker, plotRect, screenSize, transform, context) {
            var xs = transform.dataToScreenX(marker.x);
            var ys = transform.dataToScreenY(marker.y);
            var rs = transform.dataToScreenX(marker.x + marker.radius) - xs;
            var value = marker.value;

            if (value == 0 || xs + rs < 0 || xs - rs > screenSize.width || ys + rs < 0 || ys - rs > screenSize.height)
                return;

            context.beginPath();
            context.strokeStyle = "gray";
            context.fillStyle = marker.color;
            context.moveTo(xs, ys);
            context.lineTo(xs, ys - rs);
            context.arc(xs, ys, rs, -Math.PI / 2, Math.PI * (2 * value - 0.5), value < 0);
            context.lineTo(xs, ys);
            context.closePath();
            context.fill();
            context.stroke();

            context.beginPath();
            context.arc(xs, ys, rs, 0, 2 * Math.PI);
            context.stroke();
        },

        hitTest: function (marker, transform, ps, pd) {
            var r = marker.radius;
            return (pd.x - marker.x) * (pd.x - marker.x) + (pd.y - marker.y) * (pd.y - marker.y) <= r * r;
        }
    };
}(TableViewer, InteractiveDataDisplay, $));
// TaskQueue sequentially executes asynchronous functions queued through the queue() method.
// It allows cancelling all (including running) functions through the clear() method.
// queue() returns a promise which is done when the function execution successfully completes and gets the function's result as an argument.
//                                 is failed when the function execution fails and gets the fail reason as an argument
//                                           or when the function execution is cancelled and gets the value returned by TaskQueue.cancelStatus() as an argument.
(function (TableViewer, $, undefined) {
    TableViewer.TaskQueue = function () {
        // each task is 
        // { 
        //   func is a function () -> promise given by a user,
        //   response is a 'deferred' which allows to indicate the status
        //      response may fail or succeed, if it fails it contains the reason as { reason: R }, where R is 'cancelled' if the task was cancelled
        //                                    if it succeeds it contains the result of the func invocation.
        //   status is one of the following: waiting, running, cancelling, cancelled, completed, failed
        //   priority is a number, tasks with lower value are selected to run
        // }
        var tasks = [];
        var runningTask;
        var cancelStatus = 'Task is cancelled';

        var Task = function (func) {
            return {
                func: func,
                response: $.Deferred(),
                status: 'waiting'
            }
        }

        var tryRunNextTask = function () {
            runningTask = undefined;
            if (tasks.length > 0) // running a task from the queue
            {
                var task = tasks.shift(); // takes first task
                runTask(task);
            }
        }

        var onTaskCancelled = function (task) {
            task.status = 'cancelled';
            task.response.reject(cancelStatus);
        }

        var onTaskFailed = function (task, arg) {
            if (task.status == 'running') {
                task.status = 'failed';
                task.response.reject(arg);
            }
            else if (task.status == 'cancelling') {
                onTaskCancelled(task);
            }
        }

        var onTaskCompleted = function (task, arg) {
            if (task.status == 'running') {
                task.status = 'completed';
                task.response.resolve(arg);
            }
            else if (task.status == 'cancelling') {
                onTaskCancelled(task);
            }
        }

        // Gets the task, changes its state to 'running' and runs it; updates the 'runningTask' variable.
        var runTask = function (task) {
            task.status = 'running';
            runningTask = task;

            try {
                task.func()
                    .done(function (arg) { // task function completed
                        tryRunNextTask();
                        onTaskCompleted(task, arg);
                    })
                    .fail(function (arg) { // task function failed
                        tryRunNextTask();
                        onTaskFailed(task, arg);
                    });
            } catch (e) {
                tryRunNextTask();
                onTaskFailed(task, e);
            }
        }

        return {
            isRunning: function () {
                return runningTask !== undefined;
            },

            taskCount: function () {
                return tasks.length;
            },

            // returns a promise which indicates that the task is complete, failed or cancelled.
            queue: function (func, priority) {
                var task = new Task(func, priority !== undefined ? 1 : priority);
                if (this.isRunning()) {
                    var len = tasks.length;
                    for (var i = 0; i < len; i++)
                    {
                        if (tasks[i].priority > task.priority) {
                            tasks.splice(i, 0, task);
                            break;
                        }
                    }
                    if (len == tasks.length) tasks.push(task);
                }
                else {
                    runTask(task);
                }
                return task.response.promise();
            },

            clear: function () {
                if (runningTask !== undefined) {
                    runningTask.status = 'cancelling';
                    runningTask = undefined;
                }
                if (tasks.length > 0) {
                    for (var i = 0; i < tasks.length; i++) {
                        onTaskCancelled(tasks[i]);
                    }
                    tasks.splice(0, tasks.length);
                }
            },

            // returns a constant string which is passed as an argument to task's fail() continuation when it is cancelled.
            cancelStatus: function () { return cancelStatus; }
        };
    }
}(TableViewer, $));
(function (TableViewer) {
    /** Takes an object of specific schema and creates
    / * a table source object that can be used to create the table viewer. */
    function TableSource(tableDescription) {
        var columns = [];
        for(var i = 0; i < tableDescription.summary.length; i++)
            columns.push({name: tableDescription.summary[i].name, type: tableDescription.summary[i].type});
        this.totalRows = tableDescription.summary && tableDescription.summary.length > 0 ? tableDescription.summary[0].totalCount : 0;
        this.columns = columns;        
        this.summary = tableDescription.summary;
        this.pdf = tableDescription.pdf;
        this.dataByCols = tableDescription.data;
        this.correlation = tableDescription.correlation;
        this.onChanged = undefined;
        this.metadata = {};
    }
    TableSource.prototype.getDataAsync = function (startRow, rows) {
        var p = $.Deferred();
        var slices = this.dataByCols.map(function (col) {
            return Array.prototype.slice.apply(col, [startRow, startRow + rows - 1]);
        });
        p.resolve(slices);
        return p.promise();
    };
    TableSource.prototype.getSummaryAsync = function (columnNumber) {
        var res = $.Deferred();
        res.resolve(this.summary[columnNumber]);
        return res.promise();
    };
    TableSource.prototype.getPdfAsync = function (columnNumber) {
        var res = $.Deferred();
        if (this.pdf && this.pdf.length > columnNumber)
            res.resolve(this.pdf[columnNumber]);
        else
            res.reject("no data");
        return res.promise();
    };
    TableSource.prototype.getCorrelationAsync = function () {
        var res = $.Deferred();
        res.resolve(this.correlation);
        return res.promise();
    };
    TableSource.prototype.saveAttribute = function (key, value) {
        this.metadata[key] = value;
    };
    TableSource.prototype.getAttributeAsync = function (key) {
        var res = $.Deferred();
        res.resolve(this.metadata[key]);
        return res.promise();
    };
    TableSource.prototype.cancelRequests = function () {
    };
    TableViewer.TableSource = TableSource;    
})(TableViewer);

(function (TableViewer) {
    var TableColumnViewModel = (function () {
        function TableColumnViewModel(number, name, type, table) {
            this.number = number;
            this.name = name;
            this.type = type;
            this.table = table;
        }
        TableColumnViewModel.prototype.getSummaryAsync = function () {
            return this.table.getSummaryAsync(this.number);
        };
        TableColumnViewModel.prototype.getPdfAsync = function () {
            return this.table.getPdfAsync(this.number);
        };
        return TableColumnViewModel;
    })();
    var TableViewModel = (function () {
        function TableViewModel(table) {
            this.table = table;
            this.columns = [];
            var that = this;
            table.onChanged = function (args) {
                if (args.changeType == "schema") {
                    that.updateColumns();
                }
                else {
                    that.columns.forEach(function (c) {
                        if (c.onChanged) c.onChanged();
                    });
                }
                if (that.onColumnsChanged) {
                    that.onColumnsChanged(args);
                }
            };
            this.updateColumns();
        }
        TableViewModel.prototype.updateColumns = function () {
            var that = this;
            this.columns = this.table.columns.map(function (colDef, index) {
                return new TableColumnViewModel(index, colDef.name, colDef.type, that);
            });
        };
        Object.defineProperty(TableViewModel.prototype, "totalRows", {
            get: function () {
                return this.table.totalRows;
            },
            enumerable: true,
            configurable: true
        });
        TableViewModel.prototype.getDataAsync = function (startRow, rows) {
            return this.table.getDataAsync(startRow, rows);
        };
        TableViewModel.prototype.getSummaryAsync = function (columnNumber) {
            return this.table.getSummaryAsync(columnNumber);
        };
        TableViewModel.prototype.getPdfAsync = function (columnNumber) {
            return this.table.getPdfAsync(columnNumber);
        };
        TableViewModel.prototype.getCorrelationAsync = function () {
            return this.table.getCorrelationAsync();
        };
        TableViewModel.prototype.saveAttribute = function (key, value) {
            this.table.saveAttribute(key, value);
        };
        TableViewModel.prototype.getAttribute = function (key) {
            return this.table.getAttributeAsync(key);
        };
        TableViewModel.prototype.saveView = function (value) {
            this.saveAttribute("$view", value);
        };
        TableViewModel.prototype.getView = function () {
            return this.getAttributeAsync("$view");
        };
        TableViewModel.prototype.cancelAllRequests = function () {
            this.table.cancelRequests();
        };
        return TableViewModel;
    })();
    TableViewer.TableViewModel = TableViewModel;
})(TableViewer);

(function (TableViewer, $, undefined) {
    var typeToText = function (typeName) {
        if (typeName.indexOf("System.") == 0)
            typeName = typeName.substr(7);
        typeName = typeName.toLowerCase();
        if (typeName === "real") typeName = "float"; // F# notation
        else if (typeName === "int32") typeName = "int";
        return typeName;
    }

    TableViewer.TableTile = function(htmlElement, column /* TableColumnViewModel */) {
        var element = $(htmlElement);
        var chart= null;
        var bandPlot= null;
        var boxplot= null;
        var plotsBinding= null;

        InteractiveDataDisplay.Padding = 2;
        InteractiveDataDisplay.tickLength = 5;

        element
            .bind('mouseenter.' + name, function () { mouseOverBox = true; })
            .bind('mouseleave.' + name, function () { mouseOverBox = false; });

        element.html("<div class='table-tile'><div class='header'><div class='name'>Name</div><div class='rightContainer'><span class='type'></span></div></div>" +
                          "<div style='position: relative;'>" +
                          "<div class='content-chart' style='position: absolute'><div class='chart' data-idd-plot='figure'><div data-idd-axis='numeric' data-idd-placement='bottom' /></div>" +
                          "<div class='boxplot' data-idd-plot='boxplot' data-idd-style='stroke: rgb(89,150,255); thickness: 1'></div></div>" +
                          "<div class='content-summary' style='position: absolute'>" +
                          "<div class='summary-numeric'><span>min/max:</span>&nbsp;<span class='minmax'></span><span class='minmax-exp'></span></div><div class='summary-numeric'><span>lb95/ub95:</span>&nbsp;<span class='b95'>" +
                          "</span><span class='b95-exp'></span></div><div class='summary-numeric'><span>lb68/ub68:</span>&nbsp;<span class='b68'></span><span class='b68-exp'></span></div><div class='summary-numeric'><span>mean/std:</span>&nbsp;" +
                          "<span class='meanstd'></span><span class='meanstd-exp'></span></div><div class='summary-numeric'><span>median:</span>&nbsp;<span class='median'></span><span class='median-exp'></span></div><div class='summary-nonnumeric'></div>" +
                          "</div>" +
                          "</div></div>");

        var contentChart = element.find(".content-chart");
        var chart = InteractiveDataDisplay.asPlot(contentChart.find(".chart"));

        var d3Chart = chart;
        var div = $("<div></div>")
                  .attr("data-idd-name", "bplot")
                  .attr("data-idd-plot", "area")
                  .appendTo(d3Chart.host);
        var plot = new InteractiveDataDisplay.Area(div, d3Chart.master);
        d3Chart.addChild(plot);
        bandPlot = plot;

        boxplot = InteractiveDataDisplay.asPlot(contentChart.find(".boxplot"));

        chart.navigation.setVisibleRect({ x: 0, y: 0, width: 1, height: 1 });
        boxplot.navigation.setVisibleRect({ x: 0, y: -0.5, width: 1, height: 1 });

        chart.navigation.gestureSource = undefined;//InteractiveDataDisplay.Gestures.getGesturesStream(chart.host);

        var _drawSummary = function (summary) {
            var type = typeToText(column.type);
            if(column.type == "bool")
                type = type + "[" + (summary.true + summary.false) + "]";
            else
                type = type + "[" + (summary.totalCount === summary.count ? summary.totalCount : summary.totalCount + "<span class='notImportantText'>/" + summary.count + "</span>") + "]";
            element.find(".type").html(type);

            if(column.type == "bool"){
                $(".summary-numeric", element).css("display", "none");
                $(".summary-nonnumeric", element).css("display", "block");

                element.find(".summary-nonnumeric").html("<div>true:" + summary.true + "</div><div>false:" + summary.false + "</div>");
                if (chart.isVisible) {
                    boxplot.isVisible = false;
                    chart.isVisible = false;
                    contentChart.css("display", "none");
                }
            } else if (typeof (summary.min) === 'undefined') {
                $(".summary-numeric", element).css("display", "none");
                $(".summary-nonnumeric", element).css("display", "none");
                if (chart.isVisible) {
                    boxplot.isVisible = false;
                    chart.isVisible = false;
                    contentChart.css("display", "none");
                }
            } else if (typeof (summary.variance) === 'undefined') {
                $(".summary-numeric", element).css("display", "none");
                $(".summary-nonnumeric", element).css("display", "block");

                if (summary.totalCount == 1)
                    element.find(".summary-nonnumeric").html("<div>" + summary.min + "</div>");
                else if (summary.totalCount == 2)
                    element.find(".summary-nonnumeric").html("<div>" + summary.min + "</div><div>" + summary.max + "</div>");
                if (summary.totalCount > 2)
                    element.find(".summary-nonnumeric").html("<div>" + summary.min + "</div><div>...</div><div>" + summary.max + "</div>");
                if (chart.isVisible) {
                    boxplot.isVisible = false;
                    chart.isVisible = false;
                    contentChart.css("display", "none");
                }
            } else {
                $(".summary-numeric", element).css("display", "block");
                $(".summary-nonnumeric", element).css("display", "none");

                var std = Math.sqrt(summary.variance);
                var formatter = TableViewer.MathUtils.getPrintFormat(summary.min, summary.max, std);
                var f = formatter.toString;

                element.find(".minmax").html(f(summary.min) + "/" + f(summary.max));
                element.find(".meanstd").html(f(summary.mean) + "/" + f(std));
                element.find(".median").html(f(summary.median));
                element.find(".b68").html(f(summary.lb68) + "/" + f(summary.ub68));
                element.find(".b95").html(f(summary.lb95) + "/" + f(summary.ub95));

                if (formatter.exponent) {
                    element.find(".minmax-exp").html("×10<sup>" + formatter.exponent + "</sup>");
                    element.find(".meanstd-exp").html("×10<sup>" + formatter.exponent + "</sup>");
                    element.find(".median-exp").html("×10<sup>" + formatter.exponent + "</sup>");
                    element.find(".b68-exp").html("×10<sup>" + formatter.exponent + "</sup>");
                    element.find(".b95-exp").html("×10<sup>" + formatter.exponent + "</sup>");
                }

                var range = summary.max - summary.min;
                if (!chart.isVisible) {
                    contentChart.css("display", "block");
                    boxplot.isVisible = true;
                    chart.isVisible = true;
                } 
                var h = 15;
                boxplot.draw({
                    min: summary.min,
                    l95: summary.lb95,
                    l68: summary.lb68,
                    median: summary.median,
                    r68: summary.ub68,
                    r95: summary.ub95,
                    max: summary.max,
                    y: 0, height: h
                });

                if (range == 0) range = 1.0;
                var left = summary.min - range / 10;
                var right = summary.max + range / 10;

                var vr = chart.visibleRect;
                chart.navigation.setVisibleRect({ x: left, y: vr.y, width: right - left, height: vr.height });
                boxplot.navigation.setVisibleRect({ x: left, y: -0.5, width: right - left, height: 1 });
            }
        };

        var _drawPdf = function (pdf) {
            // it is called only after the _drawSummary which makes initial settings for the 'chart', too.
            if (pdf) {
                var drawArgs = {};
                drawArgs.fill = "#E8F3FF";

                if (typeof (pdf.x) === 'undefined' || typeof (pdf.f) === 'undefined') {
                    drawArgs.y1 = [];
                    drawArgs.y2 = [];
                    drawArgs.x = [];
                    bandPlot.draw(drawArgs);
                }
                else {
                    var y1 = new Array(pdf.x.length);
                    for(var i=0; i < y1.length; i++) y1[i] = 0;
                    drawArgs.y1 = y1;
                    drawArgs.y2 = pdf.f;
                    drawArgs.x = pdf.x;
                    bandPlot.draw(drawArgs);
                }
                chart.fitToViewY();
            }
        }

        var _onChanged = function () {
            column.getSummaryAsync()
                .done(function (summary) { // updating summary
                    _drawSummary(summary);
                    column.getPdfAsync()
                        .done(function (pdf) { // updating summary
                            _drawPdf(pdf);
                        })
                        .fail(function (reason) {
                            if (reason != 'Task is canceled') {
                                // todo: show the error message
                            }
                        });
                })
                .fail(function (reason) {
                    if (reason != 'Task is canceled') {
                        // todo: show the error message
                    }
                });
        };

        column.onChanged = function () {
            _onChanged();
        }
        element.find(".name").text(column.name);
        element.find(".type").text(typeToText(column.type) + "[]");
        _onChanged();
        return {
            dispose: function () {
                element.empty();
                column.onChanged = undefined;
                column = undefined;
            }
        }
    };
}(TableViewer, $));

(function (TableViewer, $, undefined) {
    // TableTileView is a UI control which displays the given TableViewer.Table as a collection of tiles (TableTile control),
    // where each tile corresponds to a single table column.
    TableViewer.showSummary = function (htmlElement, tableSource) {
        var table = new TableViewer.TableViewModel(tableSource);
        var element = $(htmlElement);
        var tiles = [];
        element
            .empty()
            .addClass("table-tileView")
            .bind('mouseenter.' + name, function () {
                mouseOverBox = true;
            })
            .bind('mouseleave.' + name, function () {
                mouseOverBox = false;
            });

        var panel = $("<div></div>")
            .appendTo(element)
            .addClass("table-tileView-panel");

        var panel_ul = $("<ul></ul>")
            .appendTo(panel);

        var _onColumnsChanged = function () {
            var ul = panel_ul;
            ul.empty();

            if (table && table.columns) {
                var columns = table.columns;
                var bindTile = function (tileDiv, column) {
                    tileDiv.bind("click", function (event) {
                        tileDiv.trigger("tileSelected", column.name);
                    });
                }
                tiles = [];
                for (var n = columns.length, i = 0; i < n; i++) {
                    var column = columns[i];
                    var li = $("<li></li>")
                        .appendTo(ul);
                    var tileDiv = $("<div></div>")
                        .appendTo(li)
                    var tile = TableViewer.TableTile(tileDiv, column);
                    tiles.push(tile);
                    bindTile(tileDiv, column);
                }
            }
        }

        table.onColumnsChanged = function (args) { if (args.changeType === 'schema') _onColumnsChanged(); }
        _onColumnsChanged();

        return {
            dispose: function () {
                tiles.forEach(function (t) { t.dispose(); });
                element
                    .empty()
                    .removeClass("table-tileView");
                table.onColumnsChanged = undefined;
                table = undefined;
                options = undefined;
            }
        };
    };
}(TableViewer, $));
(function (TableViewer, $, undefined) {
    $.fn.scrollView = function () {
        return each(function () {
            $('html, body').animate({
                scrollLeft: $(this).offset().left
            }, 1000);
        });
    };
    $.fn.dataTableExt.oPagination.four_button = {
        "fnInit": function (oSettings, nPaging, fnCallbackDraw) {
            var nFirst = document.createElement('span');
            var nPrevious = document.createElement('span');
            var nNext = document.createElement('span');
            var nLast = document.createElement('span');

            nFirst.appendChild(document.createTextNode(oSettings.oLanguage.oPaginate.sFirst));
            nPrevious.appendChild(document.createTextNode(oSettings.oLanguage.oPaginate.sPrevious));
            nNext.appendChild(document.createTextNode(oSettings.oLanguage.oPaginate.sNext));
            nLast.appendChild(document.createTextNode(oSettings.oLanguage.oPaginate.sLast));

            nFirst.className = "paginate_button first";
            nPrevious.className = "paginate_button previous";
            nNext.className = "paginate_button next";
            nLast.className = "paginate_button last";

            nPaging.appendChild(nFirst);
            nPaging.appendChild(nPrevious);
            nPaging.appendChild(nNext);
            nPaging.appendChild(nLast);

            $(nFirst).click(function () {
                oSettings.oApi._fnPageChange(oSettings, "first");
                fnCallbackDraw(oSettings);
            });

            $(nPrevious).click(function () {
                oSettings.oApi._fnPageChange(oSettings, "previous");
                fnCallbackDraw(oSettings);
            });

            $(nNext).click(function () {
                oSettings.oApi._fnPageChange(oSettings, "next");
                fnCallbackDraw(oSettings);
            });

            $(nLast).click(function () {
                oSettings.oApi._fnPageChange(oSettings, "last");
                fnCallbackDraw(oSettings);
            });

            /* Disallow text selection */
            $(nFirst).bind('selectstart', function () { return false; });
            $(nPrevious).bind('selectstart', function () { return false; });
            $(nNext).bind('selectstart', function () { return false; });
            $(nLast).bind('selectstart', function () { return false; });
        },


        "fnUpdate": function (oSettings, fnCallbackDraw) {
            if (!oSettings.aanFeatures.p) {
                return;
            }

            /* Loop over each instance of the pager */
            var an = oSettings.aanFeatures.p;
            for (var i = 0, iLen = an.length ; i < iLen ; i++) {
                var buttons = an[i].getElementsByTagName('span');
                if (oSettings._iDisplayStart === 0) {
                    buttons[0].className = "paginate_disabled_previous";
                    buttons[1].className = "paginate_disabled_previous";
                }
                else {
                    buttons[0].className = "paginate_enabled_previous";
                    buttons[1].className = "paginate_enabled_previous";
                }

                if (oSettings.fnDisplayEnd() == oSettings.fnRecordsDisplay()) {
                    buttons[2].className = "paginate_disabled_next";
                    buttons[3].className = "paginate_disabled_next";
                }
                else {
                    buttons[2].className = "paginate_enabled_next";
                    buttons[3].className = "paginate_enabled_next";
                }
            }
        }
    };
    
    // TableTileView is a UI control which displays the given TableViewer.Table as a table.
    TableViewer.showGrid = function(htmlElement, tableSource, activeColumn) {
        var table = new TableViewer.TableViewModel(tableSource);
        var element = $(htmlElement);
        var tableui = null;
        var formatters = [];
        var isAutoFormatEnabled = true;

        element
            .empty()
            .addClass("table-tableView")
            .bind('mouseenter.' + name, function () {
                mouseOverBox = true;
            })
            .bind('mouseleave.' + name, function () {
                mouseOverBox = false;
            });

        var panel = $("<div></div>")
            .appendTo(element)
            .addClass("table-tableView-panel");

        var _getTableData = function (sSource, aoData, fnCallback, oSettings) {
            // method is called by jquery.datatables plugin
            // see http://datatables.net/ref#fnServerData
            // {string}: HTTP source to obtain the data from (sAjaxSource)
            // {array}: A key/value pair object containing the data to send to the server
            // {function}: to be called on completion of the data get process will draw the data on the page.
            // {object}: DataTables settings object
            var fnGetKey = function (aoData, sKey) {
                for (var i = 0, iLen = aoData.length ; i < iLen ; i++) {
                    if (aoData[i].name == sKey) {
                        return aoData[i].value;
                    }
                }
                return null;
            }

            var startRow = fnGetKey(aoData, "iDisplayStart");
            var rows = fnGetKey(aoData, "iDisplayLength");
            var sEcho = fnGetKey(aoData, "sEcho");
            
            table.getDataAsync(startRow, rows).done(function (result) {
                var data = result;
                var total = table.totalRows;
                var coldata = [];
                for (var i in data) {
                    coldata.push(data[i]);//Is typed array OK here? To the first glance it appears to be working
                }
                var n = coldata.length;//number of columns
                var m = coldata[n - 1].length; //number of rows

                var aaData = new Array(m);
                var response = {
                    sEcho: sEcho,
                    iTotalRecords: total,
                    iTotalDisplayRecords: total,
                    aaData: aaData
                };

                for (var k = 0; k < m; k++) { // rows
                    var row = new Array(n);
                    for (var col = 0; col < n; col++) { // columns
                        row[col] = TableViewer.MathUtils.escapeHtml(coldata[col][k]);
                    }
                    aaData[k] = row;
                }

                fnCallback(response);
            })
            .fail(function () {
                alert('table data request failed');
            });
        };

        var _enableAutoFormat = function () {
            if (!tableui) return;

            var round_btn = panel.find(".round_btn");
            round_btn[0].className = "round_btn auto_format_on";
            round_btn[0].title = "Auto format is ON";

            isAutoFormatEnabled = true;
            var _formatters = formatters;
            var setFormat = function (table, i, colName, tableui) {
                table.getSummaryAsync(i).done(function (summary) {
                    if (typeof (summary.min) !== 'undefined' && typeof (summary.max) !== 'undefined' && typeof (summary.variance) !== 'undefined') {
                        var formatter = TableViewer.MathUtils.getPrintFormat(summary.min, summary.max, Math.sqrt(summary.variance));
                        _formatters[i] = formatter;

                        var colHeader = $('th:nth-child(' + (i + 1) + ')', tableui);
                        if (colHeader.length) {
                            var title = _getColumnTitle(colName, formatter);
                            colHeader.html(title);
                        }
                        tableui.fnDraw(false);
                    }
                });
            };
            var n = table.columns.length;
            for (var i = 0; i < n; i++) {
                var colName = table.columns[i].name;
                var colType = table.columns[i].type;
                if (colType != "System.String" && colType != "System.DateTime")
                    setFormat(table, i, colName, tableui);
            }
        };

        var _getColumnTitle = function (columnName, formatter) {
            var title = $("<span></span>");
            $("<span></span>").appendTo(title).text(columnName);
            if (formatter && formatter.exponent) {
                $("<span class='headerExponent'>×10<sup><small>" + formatter.exponent + "</small></sup></span>").appendTo(title);
            }
            return title;
        };

        var _disableAutoFormat = function () {
            if (!tableui) return;

            var round_btn = panel.find(".round_btn");
            round_btn[0].className = "round_btn auto_format_off";
            round_btn[0].title = "Auto format is OFF";

            isAutoFormatEnabled = false;

            $('.headerExponent', tableui).remove();
            tableui.fnDraw(false);
        };

        var _onColumnsChanged = function (activeColumnName, changeType) {
            panel.empty();
            panel_table = $("<table cellpadding='0' cellspacing='0' border='0'></table>").appendTo(panel);

            var tbl = panel_table;

            if (table && table.columns && table.columns.length > 0) {
                var columns = table.columns;
                var thead = $("<thead></thead>").appendTo(tbl)
                var tr = $("<tr></tr>").appendTo(thead);

                var n = table.columns.length;
                var _formatters;
                if (changeType == 'schema' || !formatters)
                    _formatters = formatters = new Array(n);
                else
                    _formatters = formatters;

                var colDefs = new Array(n);
                var def = function (j, colName) {
                    colDefs[j] = {
                        sClass: activeColumnName && activeColumnName == colName ? "active" : undefined,
                        mData: function (source, type, val) {
                            if (type === "set") {
                                return;
                            } else if (type === "display") {
                                var val = source[j];
                                var formatter = _formatters[j]
                                if (isAutoFormatEnabled && val && formatter) {
                                    return formatter.toString(val);
                                }
                                return val;
                            }
                            return source[j];
                        }
                    };
                };

                for (var i = 0; i < n; i++) {
                    var formatter = _formatters[i]
                    var th = $("<th></th>").appendTo(tr);
                    var colName = columns[i].name;
                    var title = _getColumnTitle(colName, formatter);
                    th.html(title);

                    if (activeColumnName && activeColumnName == columns[i].name) {
                        th.scrollView();
                    }
                    def(i, columns[i].name);
                }
                var tbody = $("<tbody></tbody>").appendTo(tbl);

                tableui = tbl.dataTable({
                    bFilter: false,
                    bSort: false,
                    bAutoWidth: true,
                    bSortClasses: false,
                    bProcessing: true,
                    bServerSide: true,
                    sAjaxSource: "-na-",
                    sDom: 'l<"toolbar">fr<t><ip>',
                    sPaginationType: "four_button",
                    fnServerData: function (sSource, aoData, fnCallback, oSettings) {
                        _getTableData(sSource, aoData, fnCallback, oSettings);
                    },
                    bStateSave: true,
                    fnStateSave: function (oSettings, oData) {
                        var settings = {
                            "start": oData.iStart,
                            "length": oData.iLength
                        };
                        table.saveAttribute("$view-table", JSON.stringify(settings));
                    },
                    aoColumns: colDefs,
                    iDisplayLength: tableSettings.length || 10,
                    iDisplayStart: tableSettings.start || 0,
                    oLanguage: {
                        oPaginate: {
                            sFirst: "first",
                            sLast: "last",
                            sNext: "next",
                            sPrevious: "previous"
                        },
                        sEmptyTable: "no data available in table",
                        sInfo: "showing _START_ to _END_ of _TOTAL_ entries",
                        sInfoEmpty: "showing 0 to 0 of 0 entries",
                        sLengthMenu: "show _MENU_ entries",
                        sLoadingRecords: "loading...",
                        sProcessing: "processing..."
                    }
                });

                tbody.on("mouseenter", "td", function () {
                    var iCol = $('td', this.parentNode).index(this);
                    $('td:nth-child(' + (iCol + 1) + ')', tableui.$('tr')).addClass('highlighted');
                });
                tbody.on("mouseleave", "td", function () {
                    tableui.$('td.highlighted').removeClass('highlighted');
                });

                // Turn auto format on/off
                var round_btn = $("div.toolbar").html('<span class="round_btn"></span>').find(".round_btn");
                round_btn.css("background-size", "contain");
                round_btn.click(function (e) {
                    if (isAutoFormatEnabled)
                        _disableAutoFormat();
                    else
                        _enableAutoFormat();
                });
                if (isAutoFormatEnabled)
                    _enableAutoFormat();
                else
                    _disableAutoFormat();
            }
        };

        table.getAttribute("$view-table").done(function (value) {
            try {
                tableSettings = value ? JSON.parse(value) : {};
            } catch (x) {
                tableSettings = {};
            }
            table.onColumnsChanged = function (e) { _onColumnsChanged(null, e.changeType); }
            _onColumnsChanged(activeColumn, 'schema');
        });

        return { 
            dispose: function () {
                element
                    .empty()
                    .removeClass("table-tableView");
                table.onColumnsChanged = undefined;
                table = undefined;
                options = undefined;
            }   
        };
    }
}(TableViewer, $));

(function (TableViewer, $, undefined) {
    $.fn.scrollView = function () {
        return this.each(function () {
            $('html, body').animate({
                scrollLeft: $(this).offset().left
            }, 1000);
        });
    }

    TableViewer.showCorrelations = function (htmlElement /*HTMLElement*/, tableSource /*TableSource*/) {
        var table = new TableViewer.TableViewModel(tableSource);
        var element = $(htmlElement);
        var axisLeft = null;
        var axisTop = null;
        var varsN = 0; // number of variables in the matrix (can be less than number of columns)
        var pcc = null;
        var selectedCellIndex = { i: -1, j: -1, isInverted: false };
        var colorPalette = InteractiveDataDisplay.ColorPalette.parse("-1=Red,White=0,Blue=1");
        var reqId = 0; // allows to order async getCorrelation responses

        element.empty().addClass("table-correlationView");
        var correlationViewContainer = $("<div style='display:none'></div>");
        element.append(correlationViewContainer);
        var msgDiv = $("<div class='message'></div>");
        element.append(msgDiv);

        var figureDiv = $("<div class='figure' data-idd-plot='figure'></div>");
        figureDiv.html('<div data-idd-plot="heatmap" data-idd-name="Correlation" data-idd-style="palette:-1=Red,White=0,Blue=1"></div><div data-idd-plot="grid" data-idd-name="grid" data-idd-placement="center" data-idd-style="stroke: DarkGray; thickness: 1px"></div><div data-idd-plot="selectedCell" data-idd-name="selectedCell" data-idd-placement="center"></div><div data-idd-plot="markers" data-idd-name="pies" data-idd-placement="center"></div>');
        correlationViewContainer.append(figureDiv);
        var figure = InteractiveDataDisplay.asPlot(figureDiv);
        figure.isToolTipEnabled = false;
        figure.navigation.gestureSource = InteractiveDataDisplay.Gestures.getGesturesStream(figureDiv);
            
        var legendDiv = $("<div class='legend'></div>")
        correlationViewContainer.append(legendDiv);
        var heatmap = figure.get("Correlation");
        heatmap.legend = new InteractiveDataDisplay.Legend(heatmap, legendDiv);

        correlationViewContainer.append($("<div class='legendHint hint'>click on a cell to see details here</div><div class='selectedPair' style='display:none;'>Pearson's correlation coefficient between "+
                "<span class='selectedPair1 highlighted'></span> and <span class='selectedPair2 highlighted'></span> is <span class='selectedPair-PCC highlighted'></span>.</div>"));
                        
        var _showDetailsFor = function (i, j, isInverted) {
            selectedCellIndex = { i: i, j: j, isInverted: isInverted };
            var selectedCell = figure.get("selectedCell");
            if (i >= 0 && j >= 0 && table && pcc && varsN > 0) {
                var n = varsN;
                if (isInverted) j = n - 1 - j;
                if (i != j && i < n && j < n && i >= 0 && j >= 0) {
                    if (isInverted)
                        selectedCell.draw({ x: i, y: n - 1 - j, n: n });
                    else
                        selectedCell.draw({ x: i, y: j, n: n });
                    var varX = table.columns[i].name;
                    var varY = table.columns[j].name;
                    element.find(".selectedPair2").text(varX);
                    element.find(".selectedPair1").text(varY);
                    if (i > j) { var l = i; i = j; j = l; }
                    element.find(".selectedPair-PCC").text(pcc[i][j - i - 1].toFixed(4));
                    element.find(".selectedPair").css("display", "block");
                    element.find(".legendHint").css("display", "none");
                    return;
                }
            }
            element.find(".selectedPair").css("display", "none");
            element.find(".legendHint").css("display", "block");
            selectedCell.draw({ x: -1, y: -1 });
        };

        var _onColumnsChanged = function (isSchemaChanged) {
            pcc = null; // obsolete data
            var cols = table.columns;
            if (cols && cols.length > 0) {
                var myReqId = ++reqId;
                msgDiv.css("display", "block").text("processing...").addClass("hint").removeClass("error");
                table.getCorrelationAsync()
                    .done(function (result) {
                        if (myReqId != reqId) return; // obsolete response
                        if (!result || !result.r || !result.c) {
                            varsN = 0;
                            correlationViewContainer.css("display", "none");
                            msgDiv.css("display", "block").text("there is nothing to display").addClass("hint").removeClass("error");
                            return;
                        }
                        msgDiv.css("display", "none");
                        var r = result.r;
                        pcc = result.r;
                        var heatmap = figure.get("Correlation");
                        var pies = figure.get("pies");
                        var n = Object.keys(r).length + 1 //r.length + 1;
                        varsN = n;
                        if (n < 2) {
                            correlationViewContainer.css("display", "none");
                        } else {
                            correlationViewContainer.css("display", "block");

                            var x = new Array(n + 1);
                            var f = new Array(n);
                            var xp = new Array(n * (n - 1) / 2);
                            var yp = new Array(n * (n - 1) / 2);
                            var fp = new Array(n * (n - 1) / 2);
                            for (var i = 0; i < n; i++) {
                                var fi = f[i] = new Array(n);
                                var ri = r[i];
                                for (var j = 0; j < n; j++) {
                                    if (i == j) fi[n - 1 - j] = 0;
                                    else if (i < j) fi[n - 1 - j] = 0;
                                    else fi[n - 1 - j] = r[j][i - j - 1];

                                    if (i < j) {
                                        fp[i * n + j] = ri[j - i - 1];
                                        xp[i * n + j] = i + 0.5;
                                        yp[i * n + j] = n - 1 - j + 0.5;
                                    }
                                }
                            }
                            for (var i = 0; i <= n; i++) {
                                x[i] = i;
                            }

                            heatmap.draw({ x: x, y: x, values: f, colorPalette: colorPalette });
                            pies.draw({ x: xp, y: yp, value: fp, color: fp, colorPalette: colorPalette, radius: 0.45, shape: TableViewer.PiesMarker });

                            if (isSchemaChanged) {
                                var labels = new Array(n);
                                var labelsHor = new Array(n);
                                    
                                for (var i = 0; i < n; i++) {
                                    var colName = TableViewer.MathUtils.escapeHtml(result.c[i]);
                                    labels[i] = colName;
                                    labelsHor[i] = colName;
                                }

                                if (axisLeft) axisLeft.axis.remove();
                                axisLeft = figure.addAxis("left", "labels",
                                    { labels: labels, ticks: x, rotate: false });
                                if (axisTop) axisTop.axis.remove();
                                axisTop = figure.addAxis("top", "labels",
                                    { labels: labelsHor, ticks: x, rotate: false });
				axisLeft.axis.FontSize = 14;
				axisTop.axis.FontSize = 14;
				figure.updateLayout();
                                var grid = figure.get("grid");
                                grid.xAxis = axisTop.axis;
                                grid.yAxis = axisLeft.axis;
                                axisLeft.axis.dataTransform = new InteractiveDataDisplay.DataTransform(
                                            function (x) { return n - x; },
                                            function (y) { return n - y; });

                                _showDetailsFor(-1, -1);
                                figure.fitToView();
                            } else {
                                _showDetailsFor(selectedCellIndex.i, selectedCellIndex.j, selectedCellIndex.isInverted);
                            }
                        } // n >= 2
                    })
                    .fail(function (err) {
                        varsN = 0;
                        correlationViewContainer.css("display", "none");
                        msgDiv.css("display", "block").text("Error: " + err).addClass("error").removeClass("hint");
                    });
            }
        }


        table.onColumnsChanged = function (args) { _onColumnsChanged(args.changeType === 'schema'); }
        _onColumnsChanged(true);

        heatmap.onClick = function (origin_s, origin_p) {
            _showDetailsFor(Math.floor(origin_p.x), Math.floor(origin_p.y), true);
        };

        return { dispose: function () {
            element
                .empty()
                .removeClass("table-correlationView");
            table.onColumnsChanged = undefined;
            figure = undefined;
            options = undefined;
        }};
    };
}(TableViewer, $));

(function (TableViewer, $) {
    TableViewer.show = function (htmlElement /*HTMLElement*/, content /*TableSource or TableDescription*/) {
        var tableSource;
        if(typeof content["getDataAsync"] !== "undefined") // TableSource
            tableSource = content;
        else // TableDescription
            tableSource = new TableViewer.TableSource(content);
        
        var jqDiv = $(htmlElement);
        jqDiv.html("<div style='margin-top: 10px; border-bottom: 1px solid #808080; padding-bottom: 10px;'><span class='summary titleCommand-on'>summary</span>" +
                   "<span class='data titleCommand'>data</span><span class='correlation titleCommand'>correlation</span></div><div class='tableviewer_container'>Initializing...</div>");
        var container = jqDiv.find(".tableviewer_container");
        jqDiv.find(".summary").click(function () { showSummary() });
        jqDiv.find(".data").click(function () { showData() });
        jqDiv.find(".correlation").click(function () { showCorrelation() });

        var _activePage = undefined; // "summary", "data", or "correlation" (must be equal to id of the button elements)
        var _destroyActiveControl;
        var switchUI = function () {
            if (_destroyActiveControl) {
                _destroyActiveControl();
                _destroyActiveControl = undefined;
            }

            var commands = jqDiv.find(".titleCommand, .titleCommand-on");
            var on = commands.filter("." + _activePage);
            var off = commands.filter(":not(." + _activePage + ")");
            on.addClass("titleCommand-on").removeClass("titleCommand");
            off.addClass("titleCommand").removeClass("titleCommand-on");
        }
        var showSummary = function () {
            if (_activePage != "summary") {
                _activePage = "summary";
                switchUI();
                showTileView();
            }
        }
        var showData = function (activeColumn) {
            if (_activePage != "data") {
                _activePage = "data";
                switchUI();
                showTableView(activeColumn);
            }
        }
        var showCorrelation = function () {
            if (_activePage != "correlation") {
                _activePage = "correlation";
                switchUI();
                showCorrelationView();
            }
        }
        var showTileView = function () {
            tableSource.cancelRequests();
            var control = TableViewer.showSummary(container, tableSource);
            tableSource.saveAttribute("$view", "tiles");
            _destroyActiveControl = function () {
                if (container.is('.table-tileView')) control.dispose();
            };
            container.on("tileSelected", function (event, columnName) {
                showData(columnName);
            });
        }
        var showTableView = function (columnName) {
            tableSource.cancelRequests();
            var control = TableViewer.showGrid(container, tableSource, columnName);
            tableSource.saveAttribute("$view", "table");
            _destroyActiveControl = function () {
                if (container.is('.table-tableView')) control.dispose();
            };
        }
        var showCorrelationView = function () {
            tableSource.cancelRequests();
            var control = TableViewer.showCorrelations(container, tableSource);
            tableSource.saveAttribute("$view", "correlation");
            _destroyActiveControl = function () {
                if (container.is('.table-correlationView')) control.dispose();
            };
        }
        showSummary();
        return {
            dispose: function () {
                if (_destroyActiveControl) _destroyActiveControl();
                jqDiv.html("");
            }
        };
    }
}(TableViewer, $));

return TableViewer;
}); // end of the factory function
}(window));
