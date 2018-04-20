(function(_, jQuery) {
    "use strict";

    var api = {
        get: function(action, params) {
            var api_ver = 3;
            var base_url = ckan.sandbox().client.endpoint;
            params = $.param(params);
            var url =
                base_url + "/api/" + api_ver + "/action/" + action + "?" + params;
            return $.getJSON(url);
        },
        post: function(action, data, async) {
            var api_ver = 3;
            var base_url = ckan.sandbox().client.endpoint;
            var url = base_url + "/api/" + api_ver + "/action/" + action;
            if (!async) {
                $.ajaxSetup({
                    async: false
                });
            }
            return $.post(url, JSON.stringify(data), "json");
        }
    };

    function _getPreviousFilters(element_id) {
        var filter_items = $("#" + element_id).prevAll();
        var filters = [];
        var name = "";
        var value = "";

        $.each(filter_items, function(idx, elem) {
            name = $(elem)
                .find("[id*=data_filter_name_]")
                .val();
            value = $(elem)
                .find("[id*=data_filter_value_]")
                .find(":selected")
                .val();
            filters.push({
                name: name,
                value: value
            });
        });
        return filters;
    }

    function _clearDependentFilters(element_id) {
        var filter_items = $("#" + element_id).nextAll();

        $.each(filter_items, function(idx, elem) {
            $(elem)
                .find("[id*=data_filter_value_]")
                .find("option")
                .not(":first")
                .remove();
        });
    }

    function handleRenderedFilters(item_id) {
        var filter_value_select;

        if (item_id) {
            filter_value_select = $("[id=data_filter_value_" + item_id + "]");
        } else {
            filter_value_select = $("[id*=data_filter_value_]");
        }

        filter_value_select.mousedown(function(event) {
            var elem = $(this);
            var filter_value_select_id = elem.attr("id");
            var filter_value = elem.find(":selected").val();

            var filter_item_id = filter_value_select_id.replace(
                "data_filter_value",
                "filter_item"
            );

            var previous_filters = _getPreviousFilters(filter_item_id);

            var filter_name_input_id = filter_value_select_id.replace(
                "value",
                "name"
            );
            var filter_name = $("#" + filter_name_input_id).val();
            var resource_id = elem.parent().parent().parent().find('.field_resource_id').val();
            var select_size = $(this)
                .find("option")
                .size();

            if (select_size <= 2) {
                api
                    .post(
                        "get_filter_values", {
                            resource_id: resource_id,
                            filter_name: filter_name,
                            previous_filters: previous_filters
                        },
                        false
                    )
                    .done(function(data) {
                        $.each(data.result, function(idx, elem) {
                            if (filter_value != elem) {
                                $("#" + filter_value_select_id).append(new Option(elem, elem));
                            }
                        });
                    });
            }
        });

        filter_value_select.change(function(event) {
            var elem = $(this);
            var filter_value_select_id = elem.attr("id");
            var filter_item_id = filter_value_select_id.replace(
                "data_filter_value",
                "filter_item"
            );

            _clearDependentFilters(filter_item_id);
        });
    }

    function handleRenderedChartFilters() {
        var chart_filter_value_select = $("[id*=chart_filter_value_]");

        chart_filter_value_select.mousedown(function(event) {
            var elem = $(this);
            var chart_filter_value_select_id = elem.attr("id");
            var chart_filter_value = elem.find(":selected").val();

            var chart_filter_name_input_id = chart_filter_value_select_id.replace(
                "value",
                "name"
            );
            var chart_filter_resource_input_id = chart_filter_value_select_id.replace(
                "value",
                "resource"
            );

            var chart_filter_name = $("#" + chart_filter_name_input_id).val();
            var resource_id = $("#" + chart_filter_resource_input_id).val();
            var select_size = $(this)
                .find("option")
                .size();

            if (select_size <= 1) {
                api
                    .post(
                        "get_filter_values", {
                            resource_id: resource_id,
                            filter_name: chart_filter_name,
                            previous_filters: []
                        },
                        false
                    )
                    .done(function(data) {
                        $.each(data.result, function(idx, elem) {
                            if (chart_filter_value != elem) {
                                $("#" + chart_filter_value_select_id).append(new Option(elem, elem));
                            }
                        });
                    });
            }
        });
    }

    function convertSVGGraphToImage(svg, callback) {
        var width = 0;
        var fontSize = 15;
        var lines = [];
        var i, j, result, img;
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var svgData = new XMLSerializer().serializeToString(svg);
        var canvasWidth = Number(svg.getAttribute('width')) + 50;
        var canvasHeight = Number(svg.getAttribute('height')) + 100;

        canvas.style.backgroundColor = 'white';
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = '#000';
        ctx.font = fontSize + 'px Arial';

        for (i = 0, j = lines.length; i < j; ++i) {
            ctx.fillText(lines[i], 20, 10 + fontSize + (fontSize + 5) * i);
        }

        img = document.createElement('img');
        img.setAttribute('src', 'data:image/svg+xml;base64,' + btoa(svgData));

        img.onload = function() {
            ctx.drawImage(img, 0, 70);

            callback(canvas.toDataURL('image/png'));
        };
    }

    $(document).ready(function(e) {
        handleRenderedFilters();
        handleRenderedChartFilters();

        //download screen as an image option
        var buttonImg = $('#download-as-image');

        buttonImg.on('click', function(targetElem) {

            // First render all SVGs to canvases
            var targetElemS = $('.container-wrapper').find('svg');
            var nodesToRecover = [];
            var nodesToRemove = [];

            var svgElem = targetElemS.find('svg');

            svgElem.each(function(index, node) {
                var parentNode = node.parentNode;
                var svg = parentNode.innerHTML;

                var canvas = document.createElement('canvas');

                canvg(canvas, svg);

                nodesToRecover.push({
                    parent: parentNode,
                    child: node
                });
                parentNode.removeChild(node);

                nodesToRemove.push({
                    parent: parentNode,
                    child: canvas
                });

                parentNode.appendChild(canvas);
            });


            html2canvas(document.body, {
                allowTaint: false,
                useCORS: true
            }).then(function(canvas) {
                // Put the SVGs back in place
                nodesToRemove.forEach(function(pair) {
                    pair.parent.removeChild(pair.child);
                });

                nodesToRecover.forEach(function(pair) {
                    pair.parent.appendChild(pair.child);
                });

                Canvas2Image.saveAsJPEG(canvas);
            });
        });

        //download chart as an image option
        var downloadBtn = $('.btn-chart-download');
        downloadBtn.on('click', function() {
            var target = $(event.target);
            var graphFileName = 'chart';
            var svg;
            svg = target.parent().parent().find('svg')[0];

            convertSVGGraphToImage(svg, function(imageData) {
                var link = document.createElement('a');

                link.download = graphFileName;
                link.href = imageData;

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        });

        // Add validation for public filters if no valid values are selected
        var updateBtn = $(".btn-update");
        updateBtn.on("click", function(event, data) {
            event.preventDefault();
            var filter_value_inputs = $("[id*=data_filter_value_]");
            var value = "";
            var valid = true;
            $.each(filter_value_inputs, function(idx, elem) {
                value = $(elem)
                    .find(":selected")
                    .val();
                if (!value) {
                    valid = false;
                }
            });
            if (valid) {
                $("#public-filters").submit();
            } else {
                //in the future display some error
                alert("Please select filter value");
            }
        });

        $("#appendedInputButtons").val(window.location.href);
        var copyBtn = $(".copyToClipboard");
        copyBtn.on("click", function() {
            var copyText = $("#appendedInputButtons");
            copyText.select();
            document.execCommand("Copy");
        });
    });
})($);