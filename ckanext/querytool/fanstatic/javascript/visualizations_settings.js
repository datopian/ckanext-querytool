(function(_, jQuery) {
    'use strict';

    function r() {
        $("select[id^=chart_field_graph_]").each(function() {
            $(this).change(function() {
                var t = $(this).attr("id"),
                    e = $("#chart_field_category_name_" + t[t.length - 1]);
                ["donut", "pie"].includes($(this).val()) ? (e.prop("value", ""), e.prop("disabled", !0)) : e.prop("disabled", !1);
                var i = $("#chart_field_x_tick_culling_max_" + t[t.length - 1]);
                ["bar", "hbar", "sbar", "shbar", "pie", "donut"].includes($(this).val()) ? i.prop("disabled", !0) : i.prop("disabled", !1);

                var r = $("#chart_field_show_labels_as_percentages_" + t[t.length - 1]),
                    n = $("#chart_field_x_text_rotate_" + t[t.length - 1]),
                    a = $("#chart_field_x_text_multiline_" + t[t.length - 1]),
                    o = $("#chart_field_y_label_" + t[t.length - 1]),
                    l = $("#chart_field_y_label_hide_" + t[t.length - 1]),
                    xl = $("#chart_field_x_label_" + t[t.length - 1]),
                    xlh = $("#chart_field_x_label_hide_" + t[t.length - 1]),
                    _ = $("#chart_field_y_from_zero_" + t[t.length - 1]),
                    yp = $("#chart_field_axis_range_" + t[t.length - 1]),
                    xfz = $("#chart_field_x_from_zero_" + t[t.length - 1]),
                    c = $("#chart_field_y_ticks_format_" + t[t.length - 1]),
                    xf = $("#chart_field_x_ticks_format_" + t[t.length - 1]),
                    d = $("#chart_field_data_format_" + t[t.length - 1]),
                    f = $("#chart_field_labels_" + t[t.length - 1]),
                    u = $("#chart_field_static_reference_columns_" + t[t.length - 1]),
                    s = $("#chart_field_static_reference_label_" + t[t.length - 1]),
                    p = $("#chart_field_dynamic_reference_type_" + t[t.length - 1]),
                    h = $("#chart_field_dynamic_reference_factor_" + t[t.length - 1]),
                    m = $("#chart_field_dynamic_reference_label_" + t[t.length - 1]);
                ["pie", "donut"].includes($(this).val()) ? (r.prop("disabled", !1), n.prop("disabled", !0), a.prop("disabled", !0), o.prop("disabled", !0), l.prop("disabled", !0), xl.prop("disabled", !0), xlh.prop("disabled", !0), _.prop("disabled", !0), yp.prop("disabled", !0), xfz.prop("disabled", !0), c.prop("disabled", !0), d.prop("disabled", !0), f.prop("disabled", !0), u.prop("disabled", !0), s.prop("disabled", !0), p.prop("disabled", !0), h.prop("disabled", !0), m.prop("disabled", !0)) : (r.prop("disabled", !0), r.prop("checked", !1), n.prop("disabled", !1), a.prop("disabled", !1), o.prop("disabled", !1), l.prop("disabled", !1), _.prop("disabled", !1), yp.prop("disabled", !1), xfz.prop("disabled", !1), c.prop("disabled", !1), xf.prop("disabled", !1), d.prop("disabled", !1), f.prop("disabled", !1), u.prop("disabled", !1), s.prop("disabled", !1), p.prop("disabled", !1), h.prop("disabled", !1), m.prop("disabled", !1))
                var q = $("#chart_field_donut_hole_" + t[t.length - 1]);
                ["pie", "donut"].includes($(this).val()) ? q.prop("disabled", !1) : q.prop("disabled", !0);
                var w = $("#chart_field_bar_width_" + t[t.length - 1]);
                ["bar", "hbar", 'sbar', 'shbar'].includes($(this).val()) ? w.prop("disabled", !1) : w.prop("disabled", !0);
            })
        })
    }! function(t, e) {
        var i = {
            get: function(t, e, i) {
                var r = ckan.sandbox().client.endpoint + "/api/3/action/" + t + "?" + (e = $.param(e));
                return i || $.ajaxSetup({
                    async: !1
                }), $.getJSON(r)
            },
            post: function(t, e, i) {
                var r = ckan.sandbox().client.endpoint + "/api/3/action/" + t;
                return i || $.ajaxSetup({
                    async: !1
                }), $.post(r, JSON.stringify(e), "json")
            },
            getTemplate: function(t, e, i, r) {
                var n = $("html").attr("lang"),
                    a = ckan.url(n + "/api/1/util/snippet/" + encodeURIComponent(t));
                return "function" == typeof e && (r = i, i = e, e = {}), $.get(a, e || {}).then(i, r)
            }
        };

        function n(e) {
            var i, r, xf;
            e ? (i = $("[id=chart_field_tick_count_" + e + "]"), r = $("[id=chart_field_y_ticks_format_" + e + "]"), xf = $("[id=chart_field_x_ticks_format_" + e + "]")) : (i = $("[id*=chart_field_tick_count_]"), r = $("[id*=chart_field_y_ticks_format_]"), xf = $("[id*=chart_field_x_ticks_format_]")), i.change(function(e) {
                var i = [{
                    text: t("Decimal (1 digit) e.g 2.5"),
                    value: ".1f"
                }, {
                    text: t("Decimal (2 digit) e.g 2.50"),
                    value: ".2f"
                }, {
                    text: t("Decimal (3 digit) e.g 2.501"),
                    value: ".3f"
                }, {
                    text: t("Decimal (4 digit) e.g 2.5012"),
                    value: ".4f"
                }, {
                    text: t("Currency e.g. $2,000"),
                    value: "$"
                }, {
                    text: t("Rounded e.g 2k"),
                    value: "s"
                }, {
                    text: t("Percentage (0 digit) e.g 25% for 0.25"),
                    value: ".0%"
                }, {
                    text: t("Percentage (1 digit) e.g 25.1% for 0.251"),
                    value: ".1%"
                }, {
                    text: t("Percentage (2 digit) e.g 25.12% for 0.2512"),
                    value: ".2%"
                }, {
                    text: t("Comma thousands separator (0 digit) e.g 2,512"),
                    value: ",.0f"
                }, {
                    text: t("Comma thousands separator (1 digit) e.g 2,512.3"),
                    value: ",.1f"
                }, {
                    text: t("Comma thousands separator (2 digit) e.g 2,512.34"),
                    value: ",.2f"
                }];
                "" !== $(this).val() ? a(r, i.slice(0, 3)) : a(r, i);
                "" !== $(this).val() ? a(xf, i.slice(0, 3)) : a(xf, i);
            })
        }

        function a(t, e) {
            t.children("option:not(:first)").remove(), $.each(e, function(e, i) {
                t.append($("<option></option>").attr("value", i.value).text(i.text))
            })
        }

        function o(t, e) {
            var r, n;
            r = e ? $("[id=" + t + "_field_filter_name_" + e + "]") : $("[id*=" + t + "_field_filter_name_]"), n = e ? $("[id=" + t + "_field_filter_value_" + e + "]") : $("[id*=" + t + "_field_filter_value_]"), r.change(function(t) {
                var e = $(this),
                    i = e.find(":selected").val(),
                    r = e.attr("id"),
                    n = r.replace("name", "value"),
                    a = r.replace("name", "alias"),
                    o = n.replace("value", "visibility"),
                    l = n.replace("field", "div"),
                    _ = a.replace("field", "div"),
                    c = o.replace("field", "div");
                $("#" + n + " option").length > 0 && $("#" + n).find("option").not(":first").remove(), "" === i ? ($("#" + n).prop("required", !1), $("#" + a).prop("required", !1), $("#" + l).addClass("hidden"), $("#" + _).addClass("hidden"), $("#" + c).addClass("hidden")) : ($("#" + n).prop("required", !0), $("#" + a).prop("required", !0), $("#" + l).removeClass("hidden"), $("#" + _).removeClass("hidden"), $("#" + c).removeClass("hidden"))
            }), n.mousedown(function(t) {
                var e = $(this),
                    r = e.attr("id"),
                    n = e.find(":selected").val(),
                    a = r.replace("value", "name"),
                    o = $("#" + a).find(":selected").val(),
                    l = $("#visualizations-form").data("chartResource"),
                    _ = $(this).find("option").size(),
                    c = $("#visualizations-form").data("mainFilters");
                _ <= 2 && i.get("get_filter_values", {
                    resource_id: l,
                    filter_name: o,
                    previous_filters: JSON.stringify(c)
                }, !1).done(function(t) {
                    $.each(t.result, function(t, e) {
                        n != e && $("#" + r).append(new Option(e, e))
                    })
                })
            })
        }

        function l() {
            $("[id*=chart_field_category_name_]").change(function(t) {
                var e = $(this),
                    i = e.find(":selected").val(),
                    r = e.attr("id").replace("category_name", "sort_div");
                "" === i ? $("#" + r).removeClass("hidden") : $("#" + r).addClass("hidden")
            })
        }

        function _() {
            $(".title textarea").change(function(e) {
                var i = nunjucks.configure({
                    tags: {
                        variableStart: "{",
                        variableEnd: "}"
                    }
                });
                try {
                    i.renderString($(e.target).val(), {}), e.target.setCustomValidity("")
                } catch (i) {
                    e.target.setCustomValidity(t("Template is invalid"))
                }
            })/*, $(".title-vars select").change(function(t) {
                var e = $(t.target),
                    i = e.closest(".item-wrapper").find(".control-group.title textarea");
                i.val(i.val() + e.val()), e.val("")
            })*/

            $('body').on('change',".title-vars select", function(t){
                var e = $(t.target),
                    i = e.closest(".item-wrapper").find(".control-group.title textarea");

                    if(e.val() != null) {
                        i.val(i.val() + e.val()), e.val("")
                    } else {
                        i.val(i.val()), e.val("")
                    }
            })

            
            //Descriptions
            $(".desc textarea").change(function(e) {
                var i = nunjucks.configure({
                    tags: {
                        variableStart: "{",
                        variableEnd: "}"
                    }
                });
                try {
                    i.renderString($(e.target).val(), {}), e.target.setCustomValidity("")
                } catch (i) {
                    e.target.setCustomValidity(t("Template is invalid"))
                }
            }), $(".desc-vars select").change(function(t) {
                var e = $(t.target),
                    i = e.closest(".item-wrapper").find(".control-group.desc textarea");
                i.val(i.val() + e.val()), e.val("")
            })

        }

        function c() {
            $("[id*=chart_field_static_reference_columns_]").not(".select2-container").not(".select2-offscreen").select2({
                placeholder: t("Click to select one or more")
            }).change(function(e) {
                var i = [],
                    r = $(this).val(),
                    n = !0,
                    a = !1,
                    o = void 0;
                try {
                    for (var l, _ = (r || [])[Symbol.iterator](); !(n = (l = _.next()).done); n = !0) {
                        var c = l.value,
                            d = c.split("|")[0];
                        c.split("|")[1];
                        if (i.includes(d)) return void e.target.setCustomValidity(t("Static Reference Columns: maximum one column per measure"));
                        i.push(d)
                    }
                } catch (t) {
                    a = !0, o = t
                } finally {
                    try {
                        n || null == _.return || _.return()
                    } finally {
                        if (a) throw o
                    }
                }
                e.target.setCustomValidity("")
            })
        }

        function d(t) {
            $("#content-settings-items").children();
            var e, i, r, n, a, o, l = $(".image_item");
            t && (n = l.find("#field-image-url"), a = l.find("#field-image-upload"), e = "media_image_url_" + t, i = "media_image_upload_" + t, (r = l.find('[data-module="custom-image-upload"]')).attr("data-module", "image-upload"), r.attr("data-module-field_upload", i), r.attr("data-module-field_url", e), a.attr("name", i), n.attr("name", e), ckan.module.initializeElement(r[0])), t ? ($("[name*=media_image_url_" + t + "]"), o = $("[name*=media_image_upload_" + t + "]")) : ($("[name*=media_image_url_]"), o = $("[name*=media_image_upload_]")), o.on("change", function() {
                var t = $(this),
                    e = t.attr("name"),
                    i = e.substr(e.lastIndexOf("_") + 1);
                $("#image_upload_" + i).val(t.val())
            })
        }
        $(document).ready(function() {
            l(), o("chart"), o("map"), o("table"), d(), _(), c();
            var e = $("#visualization-settings-items"),
                a = $("#visualizations-form"),
                f = a.data("sqlString"),
                u = a.data("chartResource"),
                s = a.data("mapResource"),
                p = a.data("yAxisValues"),
                h = a.data("mainFiltersNames"),
                m = a.data("mainFilters"),
                v = $("#choose_y_axis_column");

            function g() {
                var t = $(".item");
                $.each(t, function(t, e) {
                    var i = t + 1;
                    if ((e = $(e)).context.id.indexOf("chart_field") >= 0) { 
                        var r = e.find("[id*=chart_field_graph_]"),
                            n = e.find("[id*=chart_field_color_]"),
                            dr = e.find("[data-target*=chart_field_color_]"),
                            dtr = e.find("[data-target*=chart_field_seq_color_]"),
                            nn = e.find("[id*=chart_field_seq_color_]"),
                            nnn = e.find("[id*=chart_field_color_type_]"),
                            nnnn = e.find("[class*=chart_field_color_wrap_]"),
                            sq = e.find("[class*=seq-colors-]"),
                            dv = e.find("[class*=diver-colors-]"),
                            sa = e.find("[id*=chart_field_show_annotations_]"),
                            a = e.find("[id*=chart_field_axis_y_]"),
                            o = e.find("[id*=chart_field_axis_x_]"),
                            l = e.find("[id*=chart_field_title_]"),
                            _ = e.find("[id*=chart_field_x_text_rotate_]"),
                            c = e.find("[id*=chart_field_labels_]"),
                            d = e.find("[id*=chart_field_legend_]"),
                            f = e.find("[id*=chart_field_show_labels_as_percentages_]"),
                            u = e.find("[id*=chart_field_tooltip_name_]"),
                            s = e.find("[id*=chart_field_data_format_]"),
                            p = e.find("[id*=chart_field_y_ticks_format_]"),
                            xf = e.find("[id*=chart_field_x_ticks_format_]"),
                            h = e.find("[id*=chart_field_y_label_]"),
                            m = e.find("[id*=chart_field_y_label_hide_]"),
                            xl = e.find("[id*=chart_field_x_label_]"),
                            xlh = e.find("[id*=chart_field_x_label_hide_]"),
                            v = e.find("[id*=chart_field_y_from_zero_]"),
                            xfz = e.find("[id*=chart_field_x_from_zero_]"),
                            g = e.find("[id*=chart_field_padding_top_]"),
                            y = e.find("[id*=chart_field_padding_bottom_]"),
                            b = e.find("[id*=chart_field_tick_count_]"),
                            xx = e.find("[id*=chart_field_size_]"),
                            S = e.find("[id*=chart_field_filter_name_]"),
                            O = e.find("[id*=chart_field_filter_value_]"),
                            w = e.find("[id*=chart_div_filter_value_]"),
                            k = e.find("[id*=chart_field_filter_alias_]"),
                            j = e.find("[id*=chart_div_filter_alias_]"),
                            E = e.find("[id*=chart_field_filter_visibility_]"),
                            P = e.find("[id*=chart_div_filter_visibility_]"),
                            T = e.find("[id*=chart_field_static_reference_columns_]"),
                            C = e.find("[id*=chart_field_static_reference_label_]"),
                            z = e.find("[id*=chart_field_dynamic_reference_type_]"),
                            A = e.find("[id*=chart_field_dynamic_reference_factor_]"),
                            I = e.find("[id*=chart_field_dynamic_reference_label_]"),
                            M = e.find("[id*=chart_field_chart_padding_left_]"),
                            L = e.find("[id*=chart_field_chart_padding_bottom_]"),
                            R = e.find("[id*=chart_field_x_text_multiline_]"),
                            F = e.find("[id*=chart_field_x_tick_culling_max_]"),
                            N = e.find("[id*=chart_field_category_name_]"),
                            q = e.find("[id*=resource_id_]"),
                            D = e.find("[id*=chart_field_sort_]"),
                            V = e.find("[id*=chart_field_sort_div_]"),
                            desc = e.find("[id*=chart_field_desc_]"),
                            show_bounds = e.find("[id*=chart_field_show_bounds_]"),
                            show_bounds_label = e.find("label[for*=chart_field_show_bounds_]"),
                            show_bounds_checkbox = e.find("[id*=show_bounds_checkbox_]"),
                            lb =  e.find("[id*=lower_bounds_]"),
                            ub = e.find("[id*=upper_bounds_]"),
                            lower_bounds = e.find("[id*=chart_field_lower_bounds_]"),
                            upper_bounds = e.find("[id*=chart_field_upper_bounds_]"),
                            axis_range = e.find("[id*=chart_field_axis_range_]"),
                            show_axis_range = e.find("[id*=show_axis_range_]"),
                            axis_range_min_id = e.find("[id*=axis_range_min_]"),
                            axis_range_max_id = e.find("[id*=axis_range_max_]"),
                            axis_range_label = e.find("label[for*=chart_field_axis_range_]"),
                            plotly = e.find("[id*=chart_field_plotly_]"),
                            lplotly = e.find("[id*=chart_field_plotly_line_]"),
                            plotly_label = e.find("[id*=chart_field_plotly_label_]"),
                            donut_hole_c = e.find("[id*=chart_donut_hole_]"),
                            donut_hole_l = e.find("label[for*=chart_field_donut_hole_]"),
                            donut_hole = e.find("input[id*=chart_field_donut_hole_]"),
                            bar_width_c = e.find("[id*=chart_bar_width_]"),
                            bar_width_l = e.find("label[for*=chart_field_bar_width_]"),
                            bar_width = e.find("[id*=chart_field_bar_width_]"),
                            ltypetarget = e.find("[data-target*=chart_field_line_type_]"),
                            ltypes = e.find("[id*=chart_field_line_type_]"),
                            ltypes_label = e.find("label[for*=chart_field_line_type_]"),
                            lwidthtarget = e.find("[data-target*=chart_field_line_width_]"),
                            lwidths = e.find("[id*=chart_field_line_width_]");



                        console.log('IN VIZ SETTINGS')

                        if(dr['length'] > 1) {
                            for(var x = 1; x <= dr['length'] ; x++){
                                dr[x-1].setAttribute("data-target", "chart_field_color_" + i+"_"+x)
                                n[x].setAttribute("for", "chart_field_color_" + i+"_"+x)
                                n[x].setAttribute("id", "chart_field_color_" + i+"_"+x)
                                n[x].setAttribute("name", "chart_field_color_" + i+"_"+x)
                            }
                        } else {
                            dr.attr("data-target", "chart_field_color_" + i+"_1")
                            n.attr("for", "chart_field_color_" + i+"_1")
                            n.attr("id", "chart_field_color_" + i+"_1")
                            n.attr("name", "chart_field_color_" + i+"_1")
                        }


                        if(ltypes['length'] > 1) {
                            for(var x = 0; x < ltypes['length']; x++){
                                //ltypetarget[x].setAttribute("data-target", "chart_field_line_type_" + i+"_"+x + 1)
                                ltypes_label[x].setAttribute("for", "chart_field_line_type_" + i+"_"+(x + 1))
                                ltypes[x].setAttribute("id", "chart_field_line_type_" + i+"_"+(x + 1))
                                ltypes[x].setAttribute("name", "chart_field_line_type_" + i+"_"+(x + 1))
                            }
                        } else {
                            //ltypetarget.attr("data-target", "chart_field_line_type_" + i+"_1")
                            ltypes_label.attr("for", "chart_field_line_type_" + i+"_1")
                            ltypes.attr("id", "chart_field_line_type_" + i+"_1")
                            ltypes.attr("name", "chart_field_line_type_" + i+"_1")
                        }

                        if(lwidths['length'] > 1) {
                            for(var x = 0; x < lwidths['length']; x++){
                                lwidths[x].setAttribute("id", "chart_field_line_width_" + i+"_"+(x + 1))
                                lwidths[x].setAttribute("name", "chart_field_line_width_" + i+"_"+(x + 1))
                            }
                        } else {
                            lwidths.attr("id", "chart_field_line_width_" + i+"_1")
                            lwidths.attr("name", "chart_field_line_width_" + i+"_1")
                        }

                        e.attr("id", "chart_field_" + i), r.attr("id", "chart_field_graph_" + i), r.attr("name", "chart_field_graph_" + i), nn.attr("id", "chart_field_seq_color_" + i), nn.attr("name", "chart_field_seq_color_" + i), dtr.attr("data-target", "chart_field_seq_color_" + i), nn.attr("for", "chart_field_seq_color_" + i), nnn.attr("id", "chart_field_color_type_" + i), nnn.attr("name", "chart_field_color_type_" + i), nnnn.attr("class", "chart_field_color_wrap_" + i), sq.attr("class", "seq-colors-" + i), dv.attr("class", "diver-colors-" + i), sa.attr("id", "chart_field_show_annotations_" + i), sa.attr("name", "chart_field_show_annotations_" + i), a.attr("id", "chart_field_axis_y_" + i), a.attr("name", "chart_field_axis_y_" + i), o.attr("id", "chart_field_axis_x_" + i), o.attr("name", "chart_field_axis_x_" + i), l.attr("id", "chart_field_title_" + i), l.attr("name", "chart_field_title_" + i), _.attr("id", "chart_field_x_text_rotate_" + i), _.attr("name", "chart_field_x_text_rotate_" + i), c.attr("id", "chart_field_labels_" + i), c.attr("name", "chart_field_labels_" + i), d.attr("id", "chart_field_legend_" + i), d.attr("name", "chart_field_legend_" + i), f.attr("id", "chart_field_show_labels_as_percentages_" + i), f.attr("name", "chart_field_show_labels_as_percentages_" + i), u.attr("id", "chart_field_tooltip_name_" + i), u.attr("name", "chart_field_tooltip_name_" + i), s.attr("id", "chart_field_data_format_" + i), s.attr("name", "chart_field_data_format_" + i), p.attr("id", "chart_field_y_ticks_format_" + i), p.attr("name", "chart_field_y_ticks_format_" + i), xf.attr("id", "chart_field_x_ticks_format_" + i), xf.attr("name", "chart_field_x_ticks_format_" + i), h.attr("id", "chart_field_y_label_" + i), h.attr("name", "chart_field_y_label_" + i), m.attr("id", "chart_field_y_label_hide_" + i), m.attr("name", "chart_field_y_label_hide_" + i), xl.attr("id", "chart_field_x_label_" + i), xl.attr("name", "chart_field_x_label_" + i), xlh.attr("id", "chart_field_x_label_hide_" + i), xlh.attr("name", "chart_field_x_label_hide_" + i), v.attr("id", "chart_field_y_from_zero_" + i), v.attr("name", "chart_field_y_from_zero_" + i), xfz.attr("id", "chart_field_x_from_zero_" + i), xfz.attr("name", "chart_field_x_from_zero_" + i), g.attr("id", "chart_field_padding_top_" + i), g.attr("name", "chart_field_padding_top_" + i), y.attr("id", "chart_field_padding_bottom_" + i), y.attr("name", "chart_field_padding_bottom_" + i), xx.attr("id", "chart_field_size_" + i), xx.attr("name", "chart_field_size_" + i), S.attr("id", "chart_field_filter_name_" + i), S.attr("name", "chart_field_filter_name_" + i), b.attr("id", "chart_field_tick_count_" + i), b.attr("name", "chart_field_tick_count_" + i), O.attr("id", "chart_field_filter_value_" + i), O.attr("name", "chart_field_filter_value_" + i), w.attr("id", "chart_div_filter_value_" + i), k.attr("id", "chart_field_filter_alias_" + i), k.attr("name", "chart_field_filter_alias_" + i), j.attr("id", "chart_div_filter_alias_" + i), E.attr("id", "chart_field_filter_visibility_" + i), E.attr("name", "chart_field_filter_visibility_" + i), P.attr("id", "chart_div_filter_visibility_" + i), T.attr("id", "chart_field_static_reference_columns_" + i), T.attr("name", "chart_field_static_reference_columns_" + i), C.attr("id", "chart_field_static_reference_label_" + i), C.attr("name", "chart_field_static_reference_label_" + i), z.attr("id", "chart_field_dynamic_reference_type_" + i), z.attr("name", "chart_field_dynamic_reference_type_" + i), A.attr("id", "chart_field_dynamic_reference_factor_" + i), A.attr("name", "chart_field_dynamic_reference_factor_" + i), I.attr("id", "chart_field_dynamic_reference_label_" + i), I.attr("name", "chart_field_dynamic_reference_label_" + i), q.attr("id", "resource_id_" + i), q.attr("name", "resource_id_" + i), N.attr("id", "chart_field_category_name_" + i), N.attr("name", "chart_field_category_name_" + i), D.attr("id", "chart_field_sort_" + i), D.attr("name", "chart_field_sort_" + i), V.attr("id", "chart_field_sort_div_" + i), M.attr("id", "chart_field_chart_padding_left_" + i), M.attr("name", "chart_field_chart_padding_left_" + i), L.attr("id", "chart_field_chart_padding_bottom_" + i), L.attr("name", "chart_field_chart_padding_bottom_" + i), R.attr("id", "chart_field_x_text_multiline_" + i), R.attr("name", "chart_field_x_text_multiline_" + i), F.attr("id", "chart_field_x_tick_culling_max_" + i), F.attr("name", "chart_field_x_tick_culling_max_" + i),
                        plotly.attr("id", "chart_field_plotly_" + i), plotly.attr("name", "chart_field_plotly_" + i), lplotly.attr("id", "chart_field_plotly_line_" + i), lplotly.attr("name", "chart_field_plotly_line_" + i), plotly_label.attr("id", "chart_field_plotly_label_" + i), plotly_label.attr("name", "chart_field_plotly_label_" + i), donut_hole.attr("id", "chart_field_donut_hole_" + i), donut_hole.attr("name", "chart_field_donut_hole_" + i), donut_hole_c.attr("id", "chart_donut_hole_" + i), donut_hole_l.attr("for", "chart_field_donut_hole_" + i), bar_width.attr("id", "chart_field_bar_width_" + i), bar_width.attr("name", "chart_field_bar_width_" + i), bar_width_c.attr("id", "chart_bar_width_" + i), bar_width_l.attr("for", "chart_field_bar_width_" + i);
                        

                        if(nnn[0].value == "2"){
                            dv[0].classList.add("hidden");
                            sq[0].classList.remove("hidden");
                            //alert('seq');
                        } else {
                            //alert('diver');
                            dv[0].classList.remove("hidden");
                            sq[0].classList.add("hidden");
                        }
                        desc.attr('id', 'chart_field_desc_' + i);
                        desc.attr('name', 'chart_field_desc_' + i);

                        show_bounds.attr('id', 'chart_field_show_bounds_' + i);
                        show_bounds.attr('name', 'chart_field_show_bounds_' + i);
                        show_bounds_label.attr('for', 'chart_field_show_bounds_' + i);
                        show_bounds_checkbox.attr('id', 'show_bounds_checkbox_' + i);

                        lb.attr('id', 'lower_bounds_' + i);
                        ub.attr('id', 'upper_bounds_' + i);

                        lower_bounds.attr('id', 'chart_field_lower_bounds_' + i);
                        lower_bounds.attr('name', 'chart_field_lower_bounds_' + i);

                        upper_bounds.attr('id', 'chart_field_upper_bounds_' + i);
                        upper_bounds.attr('name', 'chart_field_upper_bounds_' + i);

                        axis_range.attr('id', 'chart_field_axis_range_' + i);
                        axis_range.attr('name', 'chart_field_axis_range_' + i);
                        show_axis_range.attr('id', 'show_axis_range_' + i);
                        axis_range_label.attr('for', 'chart_field_axis_range_' + i);
                        axis_range_min_id.attr('id', 'axis_range_min_' + i);
                        axis_range_max_id.attr('id', 'axis_range_max_' + i);

                        e.find("[id*=chart_field_graph_]").change();
                        
                    } else if (e.context.id.indexOf("text_box") >= 0) {
                        var G = e.find("[id*=text_box_description_]"),
                            J = e.find("[id*=text_box_size_]"),
                            cw = e.find("[id*=text_box_column_width_]");
                        e.attr("id", "text_box_" + i), G.attr("id", "text_box_description_" + i), G.attr("name", "text_box_description_" + i), J.attr("id", "text_box_size_" + i), J.attr("name", "text_box_size_" + i), cw.attr("id", "text_box_column_width_" + i), cw.attr("name", "text_box_column_width_" + i)
                    } else if (e.context.id.indexOf("break_line") >= 0) {
                        var G = e.find("[id*=line_break_desc]");
                        e.attr("id", "break_line_" + i), G.attr("id", "line_break_desc_" + i), G.attr("name", "line_break_desc_" + i)
                    } else if (e.context.id.indexOf("image_item") >= 0) {
                        var W = e.find("[name*=media_image_url_]"),
                            H = (J = e.find("[id*=image_field_size_]"), e.find("[name*=media_image_upload_]")),
                            U = e.find("[name*=media_clear_upload_]");
                        e.attr("id", "image_item_" + i), W.attr("name", "media_image_url_" + i), J.attr("id", "image_field_size_" + i), J.attr("name", "image_field_size_" + i), H.attr("name", "media_image_upload_" + i), U.attr("name", "media_clear_upload_" + i)
                    } else if (e.context.id.indexOf("map_item") >= 0) {
                        var B = e.find("[id*=map_resource_]"),
                            K = e.find("[id*=map_title_field_]"),
                            MT = e.find("[id*=map_custom_title_field_]"),
                            Y = e.find("[id*=map_key_field_]"),
                            Q = e.find("[id*=map_data_key_field_]"),
                            X = e.find("[id*=map_color_scheme_]"),
                            Z = e.find("[id*=map_size_]"),
                            tt = e.find("[id*=map_module_]"),
                            et = e.find("[id*=map_field_filter_name_]"),
                            it = e.find("[id*=map_field_filter_value_]"),
                            rt = e.find("[id*=map_div_filter_value_]"),
                            nt = e.find("[id*=map_field_filter_alias_]"),
                            at = e.find("[id*=map_div_filter_alias_]"),
                            ot = e.find("[id*=map_field_filter_visibility_]"),
                            lt = e.find("[id*=map_div_filter_visibility_]");
                        e.attr("id", "map_item_" + i), B.attr("id", "map_resource_" + i), B.attr("name", "map_resource_" + i), K.attr("id", "map_title_field_" + i), K.attr("name", "map_title_field_" + i), MT.attr("id", "map_custom_title_field_" + i), MT.attr("name", "map_custom_title_field_" + i), Y.attr("id", "map_key_field_" + i), Y.attr("name", "map_key_field_" + i), Q.attr("id", "map_data_key_field_" + i), Q.attr("name", "map_data_key_field_" + i), X.attr("id", "map_color_scheme_" + i), X.attr("name", "map_color_scheme_" + i), Z.attr("id", "map_size_" + i), Z.attr("name", "map_size_" + i), tt.attr("id", "map_module_" + i), et.attr("id", "map_field_filter_name_" + i), et.attr("name", "map_field_filter_name_" + i), it.attr("id", "map_field_filter_value_" + i), it.attr("name", "map_field_filter_value_" + i), rt.attr("id", "map_div_filter_value_" + i), nt.attr("id", "map_field_filter_alias_" + i), nt.attr("name", "map_field_filter_alias_" + i), at.attr("id", "map_div_filter_alias_" + i), ot.attr("id", "map_field_filter_visibility_" + i), ot.attr("name", "map_field_filter_visibility_" + i), lt.attr("id", "map_div_filter_visibility_" + i)
                    } else if (e.context.id.indexOf("table_item") >= 0) {
                        var _t = e.find("[id*=table_size_]"),
                            ct = e.find("[id*=table_data_format_]"),
                            dt = e.find("[id*=table_main_value_]"),
                            dts = e.find("[id*=table_second_value_]"),
                            ft = e.find("[id*=table_category_name_]"),
                            ut = e.find("[id*=table_field_title_]"),
                            st = e.find("[id*=table_field_filter_name_]"),
                            pt = e.find("[id*=table_field_filter_value_]"),
                            ht = e.find("[id*=table_div_filter_value_]"),
                            mt = e.find("[id*=table_field_filter_alias_]"),
                            vt = e.find("[id*=table_div_filter_alias_]"),
                            gt = e.find("[id*=table_field_filter_visibility_]"),
                            yt = e.find("[id*=table_div_filter_visibility_]");
                        e.attr("id", "table_item_" + i), _t.attr("id", "table_size_" + i), _t.attr("name", "table_size_" + i), ct.attr("id", "table_data_format_" + i), ct.attr("name", "table_data_format_" + i), dt.attr("id", "table_main_value_" + i), dt.attr("name", "table_main_value_" + i), dts.attr("id", "table_second_value_" + i), dts.attr("name", "table_second_value_" + i), ft.attr("id", "table_category_name_" + i), ft.attr("name", "table_category_name_" + i), ut.attr("id", "table_field_title_" + i), ut.attr("name", "table_field_title_" + i), st.attr("id", "table_field_filter_name_" + i), st.attr("name", "table_field_filter_name_" + i), pt.attr("id", "table_field_filter_value_" + i), pt.attr("name", "table_field_filter_value_" + i), ht.attr("id", "table_div_filter_value_" + i), mt.attr("id", "table_field_filter_alias_" + i), mt.attr("name", "table_field_filter_alias_" + i), vt.attr("id", "table_div_filter_alias_" + i), gt.attr("id", "table_field_filter_visibility_" + i), gt.attr("name", "table_field_filter_visibility_" + i), yt.attr("id", "table_div_filter_visibility_" + i)
                    }
                })
            }
            console.log('IN VISUALIZATION SETTINGS!');
            n(), $("#save-edit-data-btn").removeAttr("disabled"), $("#save-visualization-btn").removeAttr("disabled"), $(".save-visualization-btn").click(function(e) {
                0 === $(".item").length && (e.preventDefault(), alert(t("Please create at least one visualization.")))
            }), v.change(function(t) {
                $("[name*=chart_field_axis_y_]").val(t.target.value), ckan.sandbox().publish("querytool:updateCharts"), ckan.sandbox().publish("querytool:updateMaps"), ckan.sandbox().publish("querytool:updateTables")
            }), $(document).on("click", ".delete-item-btn", function(t) {
                t.target.closest(".item").remove(), g()
            }), $("#add-visualization-btn").on("click", function() {
                $.proxyAll(this, /_on/);
                var t = $("#item_type").val(),
                    a = $(".item").length + 1,
                    y = v.val(),
                    b = $("#choose_y_axis_column option:selected").text();
                if ("chart" === t) {
                    var x = window.location.href.substr(window.location.href.lastIndexOf("/") + 1).split("?")[0];
                    i.getTemplate("chart_item.html", {
                        n: a,
                        querytool: x,
                        chart_resource: u,
                        map_resource: s,
                        sql_string: f,
                        y_axis_values: p,
                        main_filters: h,
                        info_query_filters: JSON.stringify(m),
                        measure_label: b
                    }).done(function(t) {
                        var i = e.prepend(t);
                        ckan.module.initializeElement(i.find("div[data-module=querytool-viz-preview]")[0]), o("chart", a), g(), l(), _(), c(), $("[name*=chart_field_axis_y_]").val(y), n(a), r()
                    })
                } else "map" === t ? i.getTemplate("map_item.html", {
                    n: a,
                    chart_resource: u,
                    sql_string: f,
                    y_axis_column: y,
                    y_axis_values: p,
                    main_filters: h,
                    info_query_filters: JSON.stringify(m)
                }).done(function(t) {
                    var i = e.prepend(t);
                    ckan.module.initializeElement(i.find("div[data-module=querytool-map]")[0]), o("map", a), g()
                }) : "text-box" == t ? i.getTemplate("text_box_item.html", {
                    number: a,
                    main_filters: JSON.stringify(m)
                }).done(function(t) {
                    e.prepend(t);
                    g()
                }) : "image" === t ? i.getTemplate("image_item.html", {
                    n: a
                }).done(function(t) {
                    e.prepend(t);
                    d(a), g()
                }): "break-line" == t ? i.getTemplate("break_line_item.html", {
                    n: a
                }).done(function(t) {
                    e.prepend(t);
                    g()
                }) : "table" === t && i.getTemplate("table_item.html", {
                    n: a,
                    sql_string: f,
                    resource_id: u,
                    y_axis: y,
                    y_axis_values: p,
                    main_filters: h,
                    info_query_filters: JSON.stringify(m)
                }).done(function(t) {
                    var i = e.prepend(t);
                    ckan.module.initializeElement(i.find("div[data-module=querytool-table]")[0]), o("table", a), g(), l(), _(), c(), $("[name*=chart_field_axis_y_]").val(y), n(a), r()
                })
            }), dragula([e[0]], {
                moves: function(t, e, i) {
                    return i.classList.contains("grippy")
                }
            }).on("drag", function(t, e, i) {
                t.querySelector(".grippy").classList.add("cursor-grabbing")
            }).on("dragend", function(t) {
                t.querySelector(".grippy").classList.remove("cursor-grabbing"), g(), window.location.hash = t.id, window.scrollTo(0, t.offsetTop)
            }), window.handleItemsOrder = g
        })
    }(ckan.i18n.ngettext, $), $(document).on("show", ".accordion", function(t) {
        $(t.target).prev(".accordion-heading").addClass("accordion-opened")
    }), $(document).on("hide", ".accordion", function(t) {
        $(this).find(".accordion-heading").not($(t.target)).removeClass("accordion-opened")
    }), $(document).ready(function() {
        r()
    })
})();
