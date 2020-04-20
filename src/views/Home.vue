<template>
  <b-row>
    <b-col>
      <p>current center: {{currentCenter.lat}}, {{currentCenter.lng}}</p>
      <p>current zoom: {{currentZoom}}</p>
      <p>clicked: {{clicked.lat}}, {{clicked.lng}}</p>
      <b-button @click="directions">Directions</b-button>
      <ul>
        <li v-for="waypoint in waypoints" :key="waypoint">
          {{waypoint}}
        </li>
      </ul>
    </b-col>
    <b-col>
      <div style="height: 900px; width: 100%">

        <l-map
            v-if="showMap"
            :zoom="zoom"
            :center="center"
            :options="mapOptions"
            style="height: 80%"
            @update:center="centerUpdate"
            @update:zoom="zoomUpdate"
            @click="handleMapClick"
          >
            <l-tile-layer
              :url="url"
              :attribution="attribution"
            />
            <l-geo-json
              v-if="showMap"
              :geojson="geojson"
            />
          </l-map>
      </div>
      </b-col>
    </b-row>
</template>

<script>
import { latLng } from 'leaflet';
import {
  LMap, LTileLayer, LGeoJson,
} from 'vue2-leaflet';

const openrouteservice = require('openrouteservice-js');


export default {
  name: 'Home',
  components: {
    LMap,
    LTileLayer,
    LGeoJson,
  },
  created() {
  },
  data() {
    return {
      zoom: 14,
      center: latLng(42.941218896491655, -0.3136682510375977),
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      currentZoom: 14,
      currentCenter: latLng(42.941218896491655, -0.3136682510375977),
      mapOptions: {
        zoomSnap: 0.5,
      },
      showMap: true,
      Directions: new openrouteservice.Directions({
        api_key: '5b3ce3597851110001cf6248859a373add3948c98894f77ce8dbccaa',
      }),
      geojson: null,
      clicked: {},
      waypoints: [
        // [-0.332937240600586, 42.958746699681065],
        // [-0.308218002319336, 42.92720562953708],
      ],
    };
  },
  methods: {
    zoomUpdate(zoom) {
      this.currentZoom = zoom;
    },
    centerUpdate(center) {
      this.currentCenter = center;
    },
    handleMapClick(event) {
      this.clicked = event.latlng;
      this.waypoints.push([event.latlng.lng, event.latlng.lat]);
    },
    async directions() {
      const result = await this.Directions.calculate({
        coordinates: this.waypoints,
        profile: 'foot-hiking',
        format: 'geojson',
      });
      this.geojson = result;
    },
  },
};
</script>
