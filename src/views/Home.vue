<template>
  <b-row class="h-100">
    <b-col class="no-padding">
      <div style="height: 100%; width: 100%" v-on:keyup.ctrl.90="removeLastPoint">

        <l-map
            v-if="showMap"
            :zoom="zoom"
            :center="center"
            :options="mapOptions"
            style="height: 100%"
            @click.left="handleMapClick"
            @click.right="handleMapRightClick"
          >
            <l-control-layers position="topright"  ></l-control-layers>

            <!-- <l-heightgraph
              v-if="geojson && geojson.features[0].geometry.coordinates.length > 1
                && enableHeighGraph"
              :data="geojson"
              :options="{ width: 800, position: 'bottomleft', expand: true}"
              parser="ors"
              :debug="true"
              >
            </l-heightgraph> -->
            <!-- <l-tile-layer
              :url="url"
              :attribution="attribution"
            /> -->
            <l-tile-layer
              v-for="tileProvider in tileProviders"
              :key="tileProvider.name"
              :name="tileProvider.name"
              :visible="tileProvider.visible"
              :url="tileProvider.url"
              :attribution="tileProvider.attribution"
              layer-type="base"/>
            <l-geo-json
              v-if="geojson"
              :geojson="geojson"
            />
            <l-layer-group ref="features">
              <l-marker
                v-for="(coordinate, index) in coordinates"
                :lat-lng="[coordinate[1], coordinate[0]]" :key="index"
                :icon="getIcon(index)"
              >

              </l-marker>
            </l-layer-group>
            <l-control position="topleft" >
              <b-input-group size="sm" class="mb-2">
                <b-input-group-append is-text>
                  <b-icon icon="search" @click="focusOnLocation"></b-icon>
                </b-input-group-append>
                <b-form-input v-model="locationSearch" type="search" placeholder="Location"
                  @keyup.enter="focusOnLocation"></b-form-input>
              </b-input-group>
            </l-control>
            <l-control position="topright" >
              <b-button size="sm" @click="removeLastPoint">
                <b-icon icon="arrow-counterclockwise" aria-hidden="true">
                </b-icon>
              </b-button>
            </l-control>
            <l-control position="topright" >
              <b-button size="sm" @click="profile='foot-hiking'"
                :pressed="profile==='foot-hiking'">
                <b-icon icon="people" aria-hidden="true">
                </b-icon>
              </b-button>
              <b-button size="sm" @click="profile='driving-car'"
                :pressed="profile==='driving-car'">
                <b-icon icon="bicycle" aria-hidden="true">
                </b-icon>
              </b-button>
            </l-control>
            <l-control position="topright" >
              <b-button size="sm" v-b-toggle.collapse-1>
                <b-icon icon="gear-fill" aria-hidden="true">
                </b-icon>
              </b-button>
              <b-collapse id="collapse-1" class="mt-2">
                <b-card class="transparent-card">
                  <p>
                    Distance: {{distance}} km<br/>
                    Ascent: {{ascent}} m D+<br/>
                    Descent: {{descent}}m D-
                  </p>

                  <b-button size="sm" @click="toGpx">Export as GPX</b-button><br/>
                  <b-button size="sm" @click="toJson">Export as JSON</b-button><br/><br/>
                  Import from JSON:<br/>
                  <b-form-file id="file-small" size="sm" accept=".json"
                    placeholder="Choose a file or drop it here..."
                    drop-placeholder="Drop file here..."
                    v-model="file"
                    @input="fromJson"
                  >
                  </b-form-file>

                </b-card>
              </b-collapse>
            </l-control>
          </l-map>
      </div>
      </b-col>
    </b-row>
</template>

<script>
import L from 'leaflet';

import {
  LMap, LTileLayer, LGeoJson, LControlLayers, LLayerGroup, LMarker, LControl,
} from 'vue2-leaflet';
import startIcon from '@/assets/markers/start.png';
import finishIcon from '@/assets/markers/finish.png';
import circleIcon from '@/assets/markers/circle.png';
import { emptyGeoJson, addCoordinatesToGeoJson, removeXLastCoordinates } from '@/lib/geojson';
import {
  getCoordinatesFromLocation, getSegmentsFor2pointsDirection, getAltitude, getLineAltitude,
} from '@/lib/ors';
import calculateDistance from '@/lib/misc';

import config from '../config.json';

// import LHeightgraph from '../../../vue2-leaflet-height-graph/dist/Vue2LeafletHeightGraph.umd';

const { latLng } = L;

const toGpx = require('togpx');
const FileSaver = require('file-saver');
const math = require('../helpers/math');

export default {
  name: 'Home',
  components: {
    LMap,
    LTileLayer,
    LGeoJson,
    // LHeightgraph,
    LControlLayers,
    LLayerGroup,
    LMarker,
    LControl,
  },
  created() {
    // this.geojson = addCoordinatesToGeoJson(
    //   this.geojson, [[-0.331652, 42.957277, 1363.5], [-0.331005, 42.957646, 1364]],
    // );
  },
  data() {
    return {
      tileProviders: [
        {
          name: 'OpenTopoMap',
          visible: false,
          url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
          attribution:
            'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        },
        {
          name: 'Thunderforest Outdoors',
          visible: true,
          attribution:
            '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
          url: `https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=${config.thunderforestApiKey}`,
        },
      ],
      zoom: 14,
      center: latLng(42.941218896491655, -0.3136682510375977),
      mapOptions: {
        zoomSnap: 0.5,
      },
      showMap: true,
      geojson: emptyGeoJson(),
      waypoints: [
        // [-0.332937240600586, 42.958746699681065],
        // [-0.308218002319336, 42.92720562953708],
      ],
      // duration: null,
      startIcon: L.icon({
        iconUrl: startIcon,
        iconAnchor: [4, 30],

      }),
      finishIcon: L.icon({
        iconUrl: finishIcon,
        iconAnchor: [4, 32],
      }),
      circleIcon: L.icon({
        iconUrl: circleIcon,
        iconAnchor: [8, 8],
      }),
      file: null,
      profile: 'foot-hiking',
      locationSearch: '',
      enableHeighGraph: false,
    };
  },
  computed: {
    coordinates() {
      return this.waypoints.map((e) => e.coordinates);
    },
    segments() {
      const segments = [];

      if (this.waypoints.length > 0) {
        this.waypoints.slice(0, -1).forEach((waypoint) => {
          segments.push(...waypoint.segments.slice(0, -1));
        });
        const lastWaypoint = this.waypoints[this.waypoints.length - 1];
        segments.push(...lastWaypoint.segments);
      }
      return segments;
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
    distance() {
      const distanceMeters = this.waypoints.map((e) => e.distance).reduce((a, b) => a + b, 0);
      return Math.round(distanceMeters / 10) / 100;
    },
    ascent() {
      return Math.round(
        this.waypoints.map((e) => e.ascent).reduce((a, b) => a + b, 0),
      );
    },
    descent() {
      return Math.round(
        this.waypoints.map((e) => e.descent).reduce((a, b) => a + b, 0),
      );
    },
  },
  methods: {
    // zoomUpdate(zoom) {
    //   this.currentZoom = zoom;
    // },
    // centerUpdate(center) {
    //   this.currentCenter = center;
    // },
    async handleMapClick(event) {
      const lng = math.round(event.latlng.lng, 6);
      const lat = math.round(event.latlng.lat, 6);
      const coordinates = [lng, lat];
      let altitude = 0;
      const segments = [];
      let distance = 0;
      let ascent = 0;
      let descent = 0;
      if (this.waypoints.length === 0) {
        altitude = await getAltitude([lng, lat]);
        segments.push([lng, lat, altitude]);
      } else {
        const direction = await getSegmentsFor2pointsDirection(
          this.waypoints[this.waypoints.length - 1].coordinates, coordinates, this.profile,
        );
        const directionSegments = direction.coordinates;
        distance = direction.distance;
        ascent = direction.ascent;
        descent = direction.descent;
        segments.push(...directionSegments);
      }
      this.waypoints.push(
        {
          coordinates, altitude, skip: false, segments, distance, ascent, descent,
        },
      );

      this.geojson = addCoordinatesToGeoJson(
        this.geojson, segments,
      );
    },
    async handleMapRightClick(event) {
      const lng = math.round(event.latlng.lng, 6);
      const lat = math.round(event.latlng.lat, 6);
      let diff = 0;
      let altitude = 0;
      let distance = 0;

      if (this.waypoints.length === 0) {
        altitude = await getAltitude([lng, lat]);
      } else {
        const [previousLng, previousLat] = this.coordinates[this.coordinates.length - 1];
        const lineCoords = await getLineAltitude(
          [[previousLng, previousLat], [lng, lat]],
        );
        const [[,, alt1], [,, alt2]] = lineCoords;
        diff = alt2 - alt1;
        altitude = alt2;
        distance = calculateDistance(previousLat, previousLng, lat, lng);
      }
      let ascent = 0;
      let descent = 0;
      if (diff > 0) {
        ascent = diff;
      } else {
        descent = -diff;
      }
      const segments = [[lng, lat, altitude]];
      this.waypoints.push(
        {
          coordinates: [lng, lat], altitude, skip: true, segments, distance, ascent, descent,
        },
      );
      this.geojson = addCoordinatesToGeoJson(
        this.geojson, segments,
      );
      return null;
    },
    async removeLastPoint() {
      const removed = this.waypoints.pop();
      if (this.waypoints.length >= 2) {
        removeXLastCoordinates(this.geojson, removed.segments.length);
      } else {
        this.geojson = emptyGeoJson();
      }
    },
    toGpx() {
      const gpx = toGpx(this.geojson);
      const blob = new Blob([gpx]);
      FileSaver.saveAs(blob, 'off-planner.gpx');
    },
    addPointToGeoJson(point) {
      if (this.geojson.features && this.geojson.features[0]) {
        const feature = this.geojson.features[0];
        if (feature.geometry && Array.isArray(feature.geometry.coordinates)) {
          const { coordinates } = feature.geometry;
          coordinates.push(point);
        }
      }
      // TODO: add point to extras steepness
    },
    getIcon(index) {
      if (index === 0) {
        return this.startIcon;
      }
      if (index === this.coordinates.length - 1) {
        return this.finishIcon;
      }
      return this.circleIcon;
    },
    toJson() {
      const json = JSON.stringify(this.waypoints);
      const blob = new Blob([json]);
      FileSaver.saveAs(blob, 'off-planner.json');
    },
    async fromJson() {
      const fileString = await this.file.text();
      const fileJson = JSON.parse(fileString);
      this.waypoints = fileJson;
      await this.directions();
    },
    async focusOnLocation() {
      const { longitude, latitude } = await getCoordinatesFromLocation(this.locationSearch);
      if (longitude && latitude) {
        this.center = latLng(latitude, longitude);
      }
    },
  },

};
</script>

<style scoped>
  @import "~leaflet/dist/leaflet.css";
  /* @import "../../../vue2-leaflet-height-graph/dist/Vue2LeafletHeightGraph.css"; */
  .leaflet-grab {
    cursor: auto;
  }

  .leaflet-dragging .leaflet-grab{
    cursor: move;
  }

  .transparent-card {
    opacity: 0.75;
  }

  .no-padding {
    padding: 0px;
  }
</style>
