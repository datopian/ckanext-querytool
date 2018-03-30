this.ckan = this.ckan || {};
this.ckan.querytool = this.ckan.querytool || {};
this.ckan.querytool.map = this.ckan.querytool.map || {};

(function (self, $) {

  self.init = function init(elementId, mapURL) {

    renderMap(elementId, mapURL);
  };


  function renderMap(elementId, mapURL) {



    var fitBounds = true;
    initLeaflet(elementId, 39, 40, 2);



    function initLeaflet(elementId, lat, lng, zoom) {
      // geo layer
      var geoL;
      var map;

      map = new L.Map(elementId, {scrollWheelZoom: false, inertiaMaxSpeed: 200}).setView([lat, lng], zoom);

      var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
      var osm = new L.TileLayer(osmUrl, {
        minZoom: 2,
        maxZoom: 18,
        attribution: osmAttrib
      });

      map.addLayer(osm);

      if (mapURL) {
        // Initialize markers
        initDatasetMarkers(mapURL);
      }

      function initDatasetMarkers(mapURL) {

        var smallIcon = L.icon({
          iconUrl: '/base/images/marker-icon.png',
          shadowUrl: '/base/images/marker-shadow.png',
          iconRetinaUrl: '/base/images/marker-icon-2x.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        $.getJSON(mapURL).done(function (data) {
          geoL = L.geoJSON(data, {
            style: function (feature) {
              return feature.properties.style;
            },
            pointToLayer: function (fauture, latlng) {
              return L.marker(latlng, {
                icon: smallIcon
              });
            },
            onEachFeature: function (feature, layer) {
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
          }).addTo(map);

          map.on('popupopen', function (e) {
            if (map._zoom == 10) {
              var px = map.project(e.popup._latlng, 10);
              px.y -= e.popup._container.clientHeight / 2;
              map.flyTo(map.unproject(px), 10, {animate: true, duration: 1});
            } else {
              map.flyTo(e.popup._latlng, 10, {animate: true, duration: 1})
            }
            $('.leaflet-popup-content-wrapper').css({'border-top': '5px solid ' + '#121e87'});
          });

          // Properly zoom the map to fit all markers/polygons
          if (fitBounds) {
            map.fitBounds(geoL.getBounds().pad(0.5));
          }
        }).fail(function (data) {
          console.log("GeoJSON could not be loaded " + mapURL);
        });

      }

      $(document).ready(function () {
        $('.leaflet-control-zoom-in').css({'color': '#121e87'});
        $('.leaflet-control-zoom-out').css({'color': '#121e87'});

      });
    }

  }
})(this.ckan.querytool.map, this.jQuery);