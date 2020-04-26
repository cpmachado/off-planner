<template>
  <b-row class="h-100">
    <b-col>
      <!-- <p>current center: {{currentCenter.lat}}, {{currentCenter.lng}}</p> -->
      <!-- <p>current zoom: {{currentZoom}}</p> -->
      <p>clicked: {{clicked.lat}}, {{clicked.lng}}</p>
      <b-button @click="directions">Directions</b-button>
      <b-button @click="removeLastPoint">Remove last point</b-button>
      <!-- <p>Duration: {{duration}} min</p> -->
      <p>Distance: {{distance}} km</p>
      <p>Ascent: {{ascent}} m D+</p>
      <p>Descent: {{descent}}m D-</p>
      <ul>
        <li v-for="(coordinate, index) in coordinates" :key="index">
          {{coordinate}}
        </li>
      </ul>
    </b-col>
    <b-col cols="10">
      <div style="height: 100%; width: 100%">

        <l-map
            v-if="showMap"
            :zoom="zoom"
            :center="center"
            :options="mapOptions"
            style="height: 100%"
            @update:center="centerUpdate"
            @update:zoom="zoomUpdate"
            @click.left="handleMapClick"
            @click.right="handleMapRightClick"
          >
            <l-heightgraph
              v-if="geojson"
              :data="geojson"
              :options="{ width: 800, position: 'bottomleft'}"
              parser="ors"
              :expand="expand"
              >
            </l-heightgraph>
            <l-tile-layer
              :url="url"
              :attribution="attribution"
            />
            <l-geo-json
              v-if="geojson"
              :geojson="geojson"
            />
          </l-map>
      </div>
      </b-col>
    </b-row>
</template>

<script>
import L from 'leaflet';

import {
  LMap, LTileLayer, LGeoJson,
} from 'vue2-leaflet';
import LHeightgraph from '../../../vue2-leaflet-height-graph/dist/Vue2LeafletHeightGraph.umd';


const { latLng } = L;


const openrouteservice = require('openrouteservice-js');
const math = require('../helpers/math');

const apiKey = '5b3ce3597851110001cf6248859a373add3948c98894f77ce8dbccaa';

export default {
  name: 'Home',
  components: {
    LMap,
    LTileLayer,
    LGeoJson,
    LHeightgraph,
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
      geojson: null,
      clicked: {},
      waypoints: [
        // [-0.332937240600586, 42.958746699681065],
        // [-0.308218002319336, 42.92720562953708],
      ],
      // duration: null,
      distance: null,
      ascent: null,
      descent: null,
      expand: true,
    };
  },
  computed: {
    coordinates() {
      return this.waypoints.map((e) => e.coordinates);
    },
    skipSegments() {
      const skip = [];
      let i = 0;
      this.waypoints.forEach((waypoint) => {
        if (waypoint.skip) {
          skip.push(i);
        }
        i += 1;
      });
      return skip;
    },
  },
  methods: {
    zoomUpdate(zoom) {
      this.currentZoom = zoom;
    },
    centerUpdate(center) {
      this.currentCenter = center;
    },
    async handleMapClick(event) {
      this.clicked = event.latlng;
      this.waypoints.push({ coordinates: [event.latlng.lng, event.latlng.lat], skip: false });
      await this.directions();
    },
    async handleMapRightClick(event) {
      this.clicked = event.latlng;
      const lng = math.round(event.latlng.lng, 6);
      const lat = math.round(event.latlng.lat, 6);

      const altitude = await this.getAltitude([lng, lat]);
      this.waypoints.push(
        { coordinates: [lng, lat], skip: true, altitude },
      );
      await this.directions();
    },
    async removeLastPoint() {
      this.waypoints.pop();
      if (this.waypoints.length >= 2) {
        await this.directions();
      } else {
        this.geojson = null;
      }
    },
    async directions() {
      if (this.waypoints.length >= 2) {
        const Directions = new openrouteservice.Directions({
          api_key: apiKey,
        });
        const options = {
          coordinates: this.coordinates,
          profile: 'foot-hiking',
          format: 'geojson',
          elevation: true,
          extra_info: ['steepness', 'surface'],
        };
        if (this.skipSegments.length > 0) {
          options.skip_segments = this.skipSegments;
        }
        const result = await Directions.calculate(options);
        if (result) {
          // await this.$nextTick();
          if (result.features && result.features[0]) {
            const feature = result.features[0];
            if (feature.geometry && Array.isArray(feature.geometry.coordinates)) {
              const { coordinates } = feature.geometry;
              const skippedPoints = this.waypoints.filter((e) => e.skip && e.altitude);
              console.log(skippedPoints);
              console.log(coordinates);

              skippedPoints.forEach((skippedPoint) => {
                const foundCoord = coordinates.find(
                  (coordinate) => coordinate[0] === skippedPoint.coordinates[0]
                  && coordinate[1] === skippedPoint.coordinates[1],
                );
                console.log(foundCoord);
                if (foundCoord) {
                  foundCoord[2] = skippedPoint.altitude;
                }
              });
            }
            if (feature.properties) {
              const prop = feature.properties;
              this.ascent = prop.ascent;
              this.descent = prop.descent;
              if (prop.summary) {
                this.distance = Math.round(prop.summary.distance / 10) / 100;
                // this.duration = Math.round(prop.summary.duration / 60);
              }
            }
          }
          this.geojson = result;
        }
      }
    },
    async getAltitude(coordinates) {
      const Elevation = new openrouteservice.Elevation({
        api_key: apiKey,
      });
      const result = await Elevation.pointElevation({
        format_in: 'point',
        format_out: 'point',
        geometry: coordinates,
      });
      if (result && result.geometry) {
        const [,, altitude] = result.geometry;
        return altitude || 0;
      }
      return 0;
    },
  },
};
</script>

<style>
  @import "~leaflet/dist/leaflet.css";
  @import "../../../vue2-leaflet-height-graph/dist/Vue2LeafletHeightGraph.css";
</style>
