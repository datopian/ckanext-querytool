ckan.module('querytool_map', function($, _) {
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
            this.mainProperty = this.el.parent().parent().find('[id*=map_main_property_]');
            this.mapResource.change(this.onResourceChange.bind(this));
            this.mainProperty.change(this.onPropertyChange.bind(this))

            $('.leaflet-control-zoom-in').css({
                'color': '#121e87'
            });
            $('.leaflet-control-zoom-out').css({
                'color': '#121e87'
            });

        },
        resetMap: function() {

            this.options.map_resource = this.mapResourceVal;
            this.options.main_property = this.mainPropertyVal;

            this.mainProperty.find('option').not(':first').remove();
            if (this.map.hasLayer(this.geoL)) {
                this.map.removeLayer(this.geoL);
            }
            if (this.legend) {
                this.map.removeControl(this.legend);
            }

            this.map.setView([39, 40], 2);

        },
        onResourceChange: function() {

            this.mapResourceVal = this.mapResource.val();
            this.mainPropertyVal = this.mainProperty.val();

            if (this.options.map_resource != this.mapResourceVal && this.mapResourceVal != '') {

                api.get('querytool_get_geojson_properties', {
                        map_resource: this.mapResourceVal
                    })
                    .done(function(data) {
                        if (data.success) {

                            this.mainProperty.find('option').not(':first').remove();

                            $.each(data.result, function(idx, elem) {
                                this.mainProperty.append(new Option(elem.text, elem.value));
                            }.bind(this));

                            if (this.map.hasLayer(this.geoL)) {
                                this.map.removeLayer(this.geoL);
                            }
                            if (this.legend) {
                                this.map.removeControl(this.legend);
                            }
                            this.options.map_resource = this.mapResourceVal;
                            this.options.main_property = this.mainPropertyVal;
                            this.initializeMarkers.call(this, this.options.map_resource);

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

            var mainPropertyVal = this.mainProperty.val();
            if (this.legend) {
                this.map.removeControl(this.legend);
            }
            this.options.main_property = mainPropertyVal;
            this.initializeMarkers.call(this, this.options.map_resource);

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
            var osm = new L.TileLayer(osmUrl, {
                minZoom: 2,
                maxZoom: 18,
                attribution: osmAttrib
            });

            this.map.addLayer(osm);

            if (mapURL) {
                // Initialize markers
                this.initializeMarkers.call(this, mapURL);
            }

        },
        createScale: function(featuresValues) {
            var colors = ['#ffeda0',
                '#fed976',
                '#feb24c',
                '#fd8d3c',
                '#fc4e2a',
                '#e31a1c',
                '#bd0026',
                '#800026'
            ];

            var values = featuresValues.sort(function(a, b) {
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
            var self = this;
            var scale = this.createScale(this.mainPropertieValues);
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
                        self.formatNumber(grades[i]) +
                        (grades[i + 1] ? '&ndash;' + self.formatNumber(grades[i + 1]) + '</li>' : '+</li></ul>');
                }

                ul.innerHTML +=
                    '<li><span style="background:' + '#F7FBFF' + '; opacity: ' + opacity + '"></span> ' +
                    noDataLabel + '</li>';

                return div;
            };

            this.legend.addTo(this.map);
        },
        initializeMarkers: function(mapURL) {

            var self = this;
            var smallIcon = L.icon({
                iconUrl: '/base/images/marker-icon.png',
                shadowUrl: '/base/images/marker-shadow.png',
                iconRetinaUrl: '/base/images/marker-icon-2x.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            $.getJSON(mapURL).done(function(data) {

                self.mainPropertieValues = [];
                data.features.forEach(function(feature) {
                    var str = feature.properties[self.options.main_property];
                    self.mainPropertieValues.push(parseInt(str));
                });

                var scale = this.createScale(self.mainPropertieValues);
                this.geoL = L.geoJSON(data, {
                    style: function(feature) {
                        var property = feature.properties[self.options.main_property];

                        return {
                            fillColor: (property) ? scale(property) : '#F7FBFF',
                            weight: 2,
                            opacity: 1,
                            color: 'white',
                            dashArray: '3',
                            fillOpacity: 0.7
                        };
                    },
                    pointToLayer: function(fauture, latlng) {
                        return L.marker(latlng, {
                            icon: smallIcon
                        });
                    },
                    onEachFeature: function(feature, layer) {
                        var popup = document.createElement("div"),
                            list = document.createElement("ul"),
                            listElement,
                            listElementText,
                            boldElement,
                            boldElementText;
                        for (var info in feature.properties) {
                            boldElementText = document.createTextNode(info + ': ');
                            boldElement = document.createElement("b");
                            boldElement.appendChild(boldElementText);
                            listElementText = document.createTextNode(feature.properties[info]);
                            listElement = document.createElement("li");
                            listElement.appendChild(boldElement);
                            listElement.appendChild(listElementText);
                            list.appendChild(listElement);
                        }
                        popup.appendChild(list);
                        layer.bindPopup(popup);
                        //              layer.name = feature.properties[mainField];
                    }
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
            }.bind(this)).fail(function(data) {
                console.log("GeoJSON could not be loaded " + mapURL);
            });

        }
    }
});