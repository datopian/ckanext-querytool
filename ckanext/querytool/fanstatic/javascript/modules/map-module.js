ckan.module('querytool_map', function($, _) {
    'use strict';

    return {
        initialize: function() {

            this.initLeaflet();
            this.mapResource = this.el.parent().parent().find('[id*=map_resource_]');
            this.mapResource.change(this.updateMap.bind(this))

            $('.leaflet-control-zoom-in').css({
                'color': '#121e87'
            });
            $('.leaflet-control-zoom-out').css({
                'color': '#121e87'
            });

        },

        updateMap: function() {

            var mapResourceVal = this.mapResource.val();

            if (this.options.map_resource != mapResourceVal) {
                this.map.removeLayer(this.geoL);
                this.options.map_resource = mapResourceVal;
                this.initializeMarkers.call(this, this.options.map_resource);
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
                scrollWheelZoom: true,
                inertiaMaxSpeed: 200
            }).setView([lat, lng], zoom);

            var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
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

            $.getJSON(mapURL).done(function(data) {
                this.geoL = L.geoJSON(data, {
                    style: function(feature) {
                        return feature.properties.style;
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