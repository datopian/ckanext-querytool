ckan.module('querytool-map', function($, _) {
    'use strict';

    var api = {
        get: function(action, params) {
            var api_ver = 3;
            var base_url = ckan.sandbox().client.endpoint;
            params = $.param(params);
            var url = base_url + '/api/' + api_ver + '/action/' + action + '?' + params;
            return $.getJSON(url);
        },
        post: function(action, data) {
            var api_ver = 3;
            var base_url = ckan.sandbox().client.endpoint;
            var url = base_url + '/api/' + api_ver + '/action/' + action;
            return $.post(url, JSON.stringify(data), 'json');
        }
    };

    return {
        initialize: function() {

            this.initLeaflet.call(this);
            this.mapResource = this.el.parent().parent().find('[id*=map_resource_]');
            this.mapKeyField = this.el.parent().parent().find('[id*=map_key_field_]');
            this.dataKeyField = this.el.parent().parent().find('[id*=map_data_key_field_]');
            this.valueField = $('#choose_y_axis_column');
            this.mapResource.change(this.onResourceChange.bind(this));
            this.mapKeyField.change(this.onPropertyChange.bind(this));
            this.dataKeyField.change(this.onPropertyChange.bind(this));

            $('.leaflet-control-zoom-in').css({
                'color': '#121e87'
            });
            $('.leaflet-control-zoom-out').css({
                'color': '#121e87'
            });
            this.sandbox.subscribe('querytool:updateMaps', this.onPropertyChange.bind(this));
        },
        resetMap: function() {

            this.options.map_resource = this.mapResource.val();
            this.options.map_key_field = this.mapKeyField.val();
            this.options.data_key_field = this.dataKeyField.val();
            this.options.y_axis_column = this.valueField.val();

            this.map.eachLayer(function(layer) {
                if (layer != this.osm) {
                    this.map.removeLayer(layer);
                }
            }.bind(this));

            if (this.legend) {
                this.map.removeControl(this.legend);
            }
            this.map.setView([39, 40], 2);
        },
        onResourceChange: function() {

            this.options.map_key_field = this.mapKeyField.val();
            this.options.data_key_field = this.dataKeyField.val();
            this.options.y_axis_column = this.valueField.val();

            if (this.options.map_resource != this.mapResource.val() && this.mapResource.val() != '') {
                this.options.map_resource = this.mapResource.val();

                api.get('querytool_get_geojson_properties', {
                        map_resource: this.options.map_resource
                    })
                    .done(function(data) {
                        if (data.success) {

                            this.mapKeyField.find('option').not(':first').remove();

                            $.each(data.result, function(idx, elem) {
                                this.mapKeyField.append(new Option(elem.text, elem.value));
                            }.bind(this));
                            this.resetMap.call(this);
                        } else {
                            this.resetMap.call(this);
                        }
                    }.bind(this))
                    .error(function(error) {
                        this.resetMap.call(this);
                    }.bind(this));
            } else {
                this.resetMap.call(this);
            }
        },
        onPropertyChange: function() {

            this.options.map_resource = this.mapResource.val();
            this.options.map_key_field = this.mapKeyField.val();
            this.options.data_key_field = this.dataKeyField.val();
            this.options.y_axis_column = this.valueField.val();


            if (this.options.map_key_field && this.options.data_key_field && this.options.map_resource && this.options.y_axis_column) {

                if (this.legend) {
                    this.map.removeControl(this.legend);
                }
                this.map.eachLayer(function(layer) {
                    if (layer != this.osm) {
                        this.map.removeLayer(layer);
                    }
                }.bind(this));
                this.initializeMarkers.call(this, this.options.map_resource);
            } else {
                this.resetMap.call(this);
            }
        },
        initLeaflet: function() {
            // geo layer
            var mapURL = (this.options.map_resource === true) ? '' : this.options.map_resource;

            var elementId = this.el[0].id;
            var lat = 39;
            var lng = 40;
            var zoom = 2;

            this.map = new L.Map(elementId, {
                scrollWheelZoom: false,
                inertiaMaxSpeed: 200
            }).setView([lat, lng], zoom);

            var osmUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
            var osmAttrib = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ';
            this.osm = new L.TileLayer(osmUrl, {
                minZoom: 2,
                maxZoom: 18,
                attribution: osmAttrib
            });

            this.map.addLayer(this.osm);

            if (mapURL) {
                // Initialize markers
                this.initializeMarkers.call(this, mapURL);
            }

        },
        createScale: function(featuresValues) {
            var colors = ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'];

            var values = $.map(featuresValues, function(feature, key) {
                    return feature.value;
                }).sort(function(a, b) {
                    return a - b;
                }),
                min = values[0],
                max = values[values.length - 1];

            return d3.scale.quantize()
                .domain([min, max])
                .range(colors);
        },
        formatNumber: function(num) {
            return (num % 1 ? num.toFixed(2) : num);
        },
        createLegend: function() {
            var scale = this.createScale(this.featuresValues);
            var opacity = 1;
            var noDataLabel = 'No data'
            this.legend = L.control({
                position: 'bottomright'
            });

            this.legend.onAdd = function(map) {
                var div = L.DomUtil.create('div', 'info'),
                    ul = L.DomUtil.create('ul', 'legend'),
                    domain = scale.domain(),
                    range = scale.range(),
                    min = domain[0] + 0.0000000001,
                    max = domain[domain.length - 1],
                    step = (max - min) / range.length,
                    grades = $.map(range, function(_, i) {
                        return (min + step * i);
                    }),
                    labels = [];

                div.appendChild(ul);
                for (var i = 0, len = grades.length; i < len; i++) {
                    ul.innerHTML +=
                        '<li><span style="background:' + scale(grades[i]) + '; opacity: ' + opacity + '"></span> ' +
                        this.formatNumber(grades[i]) +
                        (grades[i + 1] ? '&ndash;' + this.formatNumber(grades[i + 1]) + '</li>' : '+</li></ul>');
                }
                ul.innerHTML +=
                    '<li><span style="background:' + '#bdbdbd' + '; opacity: ' + opacity + '"></span> ' +
                    noDataLabel + '</li>';

                return div;
            }.bind(this);

            this.legend.addTo(this.map);
        },
        initializeMarkers: function(mapURL) {

            var smallIcon = L.icon({
                iconUrl: '/base/images/marker-icon.png',
                shadowUrl: '/base/images/marker-shadow.png',
                iconRetinaUrl: '/base/images/marker-icon-2x.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            var parsedSqlString = this.options.sql_string.split('*');
            var sqlStringExceptSelect = parsedSqlString[1];

            api.get('querytool_get_map_data', {
                    geojson_url: mapURL,
                    map_key_field: this.options.map_key_field,
                    data_key_field: this.options.data_key_field,
                    data_value_field: this.options.y_axis_column,
                    sql_string: sqlStringExceptSelect

                })
                .done(function(data) {
                    if (data.success) {
                        var geoJSON = data.result['geojson_data'];
                        this.featuresValues = data.result['features_values'];


                        var scale = this.createScale(this.featuresValues);
                        this.geoL = L.geoJSON(geoJSON, {
                            style: function(feature) {

                                var elementData = this.featuresValues[feature.properties[this.options.map_key_field]],
                                    value = elementData && elementData.value,
                                    color = (value) ? scale(value) : '#737373';

                                return {
                                    fillColor: color,
                                    weight: 2,
                                    opacity: 1,
                                    color: 'white',
                                    dashArray: '3',
                                    fillOpacity: 0.7
                                };
                            }.bind(this),
                            pointToLayer: function(fauture, latlng) {
                                return L.marker(latlng, {
                                    icon: smallIcon
                                });
                            },
                            onEachFeature: function(feature, layer) {
                                var elementData = this.featuresValues[feature.properties[this.options.map_key_field]];


                                if (elementData) {
                                    var popup = document.createElement("div"),
                                        list = document.createElement("ul"),
                                        listElement,
                                        listElementText,
                                        boldElement,
                                        boldElementText;

                                    boldElementText = document.createTextNode(this.options.data_key_field + ': ');
                                    boldElement = document.createElement("b");
                                    boldElement.appendChild(boldElementText);
                                    listElementText = document.createTextNode(elementData['key']);
                                    listElement = document.createElement("li");
                                    listElement.appendChild(boldElement);
                                    listElement.appendChild(listElementText);
                                    list.appendChild(listElement);

                                    boldElementText = document.createTextNode(this.options.y_axis_column + ': ');
                                    boldElement = document.createElement("b");
                                    boldElement.appendChild(boldElementText);
                                    listElementText = document.createTextNode(this.formatNumber(parseFloat(elementData['value'])));
                                    listElement = document.createElement("li");
                                    listElement.appendChild(boldElement);
                                    listElement.appendChild(listElementText);
                                    list.appendChild(listElement);

                                    popup.appendChild(list);
                                    layer.bindPopup(popup);

                                }
                            }.bind(this)
                        }).addTo(this.map);

                        this.createLegend.call(this);

                        this.map.on('popupopen', function(e) {
                            if (this.map._zoom == 10) {
                                var px = this.map.project(e.popup._latlng, 10);
                                px.y -= e.popup._container.clientHeight / 2;
                                this.map.flyTo(this.map.unproject(px), 10, {
                                    animate: true,
                                    duration: 1
                                });
                            } else {
                                this.map.flyTo(e.popup._latlng, 10, {
                                    animate: true,
                                    duration: 1
                                })
                            }
                            $('.leaflet-popup-content-wrapper').css({
                                'border-top': '5px solid ' + '#121e87'
                            });
                        }.bind(this));
                        // Properly zoom the map to fit all markers/polygons
                        this.map.fitBounds(this.geoL.getBounds().pad(0.5));
                    } else {
                        this.resetMap.call(this);
                    }
                }.bind(this))
                .error(function(error) {
                    this.resetMap.call(this);
                }.bind(this));

        },
        teardown: function() {
            // We must always unsubscribe on teardown to prevent memory leaks.
            this.sandbox.unsubscribe('querytool:updateMaps', this.onPropertyChange.bind(this));
        },
    }
});