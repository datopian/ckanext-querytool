(function(_, jQuery) {
    "use strict";

    var api = {
        get: function(action, params, async) {
            var api_ver = 3;
            var base_url = ckan.sandbox().client.endpoint;
            params = $.param(params);
            var url =
                base_url + "/api/" + api_ver + "/action/" + action + "?" + params;
            if (!async) {
                $.ajaxSetup({
                    async: false
                });
            }
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
                    .get(
                        "get_filter_values", {
                            resource_id: resource_id,
                            filter_name: filter_name,
                            previous_filters: JSON.stringify(previous_filters)
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

    function handleRenderedVisualizationsFilters() {
        var filter_value_select = $("[id*=viz_filter_value_]");

        filter_value_select.mousedown(function(event) {
            var elem = $(this);
            var filter_value_select_id = elem.attr("id");
            var filter_value = elem.find(":selected").val();

            var filter_name_input_id = filter_value_select_id.replace(
                "value",
                "name"
            );
            var filter_resource_input_id = filter_value_select_id.replace(
                "value",
                "resource"
            );

            var querytool_name_input_id = filter_value_select_id.replace(
                "value",
                "querytool_name"
            );
            var querytool_name = $("#" + querytool_name_input_id).val();
            var filtersDiv = $("#" + querytool_name + "_public_filters");
            var mainFilters = filtersDiv.data('mainFilters');

            var filter_name = $("#" + filter_name_input_id).val();
            var resource_id = $("#" + filter_resource_input_id).val();
            var select_size = $(this)
                .find("option")
                .size();

            if (select_size <= 1) {
                api
                    .get(
                        "get_filter_values", {
                            resource_id: resource_id,
                            filter_name: filter_name,
                            previous_filters: JSON.stringify(mainFilters)
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
        handleRenderedVisualizationsFilters();

        //download screen as an image option
        var buttonImg = $('#download-as-image');

        buttonImg.on('click', function(targetElem) {

            var nodeList = document.querySelectorAll('.c3-lines path');
            var nodeList2 = document.querySelectorAll('.c3-axis path');
            var line_graph = Array.from(nodeList);
            var x_and_y = Array.from(nodeList2);

            //fix weird back fill
            line_graph.forEach(function(element){
                element.style.fill = "none";
            });
            //fix axes
            x_and_y.forEach(function(element){
                element.style.fill = "none";
                element.style.stroke = "black";
            });
            // fix references
            d3.selectAll('.c3-ygrid-line.base line').attr("stroke", "grey");

            html2canvas(document.body, {
              //fix images
              ignoreElements: function(element) {
                if (element.classList.contains('html2canvas-ignore')) return true;
              },
            }).then(function(canvas) {
                Canvas2Image.saveAsPNG(canvas);
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
                $("#public-filters").attr('action', '#' + $(this).data('anchor'))
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

    $(window).load(function(){
      setTimeout(function() {
        $("text.c3-title").each(function() {
          useTitleAsHtml($(this));
        })
      }, 500);

      setInterval(function() {
        $("text.c3-title").each(function() {
          useTitleAsHtml($(this));
        })
      }, 2000);
    })

    function useTitleAsHtml(titleObj) {
      if (titleObj.html() !== '') {
        var parentSvg = titleObj.parent();
        var ns = 'http://www.w3.org/2000/svg';
        var foreignObject = document.createElementNS( ns, 'foreignObject');
        if ($(window).width() < 980) {
          foreignObject.setAttribute('height', 28);
        } else {
          foreignObject.setAttribute('height', 36);
        }
        foreignObject.setAttribute('width', parentSvg.width());
        var div = document.createElement('div');
        div.setAttribute('class', 'c3-title title-splitted');
        var trimmedTitle = $.trim(titleObj.html().replace(/[\t\n]+/g,' '));
        div.setAttribute('title', trimmedTitle);
        div.innerHTML = titleObj.html();
        foreignObject.appendChild(div);
        parentSvg.append(foreignObject);
        titleObj.html('');
      }
    }

})($);
