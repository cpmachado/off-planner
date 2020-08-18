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
            @update:center="centerUpdate"
            @update:zoom="zoomUpdate"
            @click.left="handleMapClick"
            @click.right="handleMapRightClick"
          >
            <l-control-layers position="topright"  ></l-control-layers>

            <l-heightgraph
              v-if="geojson && geojson.features[0].geometry.coordinates.length > 1"
              :data="geojson"
              :options="{ width: 800, position: 'bottomleft', expand: true}"
              parser="ors"
              :debug="true"
              >
            </l-heightgraph>
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
            <l-control position="topright" >
              <b-button size="sm" @click="removeLastPoint">
                <b-icon icon="arrow-counterclockwise" aria-hidden="true">
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
import { emptyGeoJson, addCoordinatesToGeoJson } from '@/lib/geojson';

import LHeightgraph from '../../../vue2-leaflet-height-graph/dist/Vue2LeafletHeightGraph.umd';

const { latLng } = L;

const openrouteservice = require('openrouteservice-js');
const toGpx = require('togpx');
const FileSaver = require('file-saver');
const math = require('../helpers/math');

const apiKey = '5b3ce3597851110001cf6248859a373add3948c98894f77ce8dbccaa';

export default {
  name: 'Home',
  components: {
    LMap,
    LTileLayer,
    LGeoJson,
    LHeightgraph,
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
          url: 'https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=6b982c516ec2414c8add22d504c1ebff',
        },
      ],
      zoom: 14,
      center: latLng(42.941218896491655, -0.3136682510375977),
      currentZoom: 14,
      currentCenter: latLng(42.941218896491655, -0.3136682510375977),
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
      distance: null,
      ascent: null,
      descent: null,
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
  },
  methods: {
    zoomUpdate(zoom) {
      this.currentZoom = zoom;
    },
    centerUpdate(center) {
      this.currentCenter = center;
    },
    async handleMapClick(event) {
      const lng = math.round(event.latlng.lng, 6);
      const lat = math.round(event.latlng.lat, 6);
      const coordinates = [lng, lat];
      let altitude = 0;
      const segments = [];
      if (this.waypoints.length === 0) {
        altitude = await this.getAltitude([lng, lat]);
        segments.push([lng, lat, altitude]);
      } else {
        const directionSegments = await this.getSegmentsFor2pointsDirection(
          this.waypoints[this.waypoints.length - 1].coordinates, coordinates,
        );
        segments.push(...directionSegments);
      }
      this.waypoints.push(
        {
          coordinates, altitude, skip: false, segments,
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
      if (this.waypoints.length === 0) {
        altitude = await this.getAltitude([lng, lat]);
      } else {
        const lineCoords = await this.getLineAltitude(
          [this.coordinates[this.coordinates.length - 1], [lng, lat]],
        );
        const [[,, alt1], [,, alt2]] = lineCoords;
        diff = alt2 - alt1;
        altitude = alt2;
      }
      this.waypoints.push(
        {
          coordinates: [lng, lat], skip: true, altitude, diff,
        },
      );
      // await this.directions();
      // this.addPointToGeoJson([lng, lat, alt2]);
      this.geojson = addCoordinatesToGeoJson(
        this.geojson, [[lng, lat, altitude]],
      );
      return null;
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
          extra_info: ['steepness'],
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
              // console.log(skippedPoints);
              // console.log(coordinates);

              skippedPoints.forEach((skippedPoint) => {
                const foundCoord = coordinates.find(
                  (coordinate) => coordinate[0] === skippedPoint.coordinates[0]
                  && coordinate[1] === skippedPoint.coordinates[1],
                );
                // console.log(foundCoord);
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
              const skippedPoints = this.waypoints.filter((e) => e.skip && e.diff);
              skippedPoints.forEach((skippedPoint) => {
                if (skippedPoint.diff > 0) {
                  this.ascent += skippedPoint.diff;
                } else {
                  this.descent -= skippedPoint.diff;
                }
              });
            }
          }
          this.geojson = result;
        }
      }
    },
    async getSegmentsFor2pointsDirection(point1, point2) {
      const Directions = new openrouteservice.Directions({
        api_key: apiKey,
      });
      const options = {
        coordinates: [point1, point2],
        profile: 'foot-hiking',
        format: 'geojson',
        elevation: true,
        extra_info: ['steepness'],
      };
      const result = await Directions.calculate(options);
      if (result && result.features && result.features[0]) {
        const feature = result.features[0];
        if (feature.geometry && Array.isArray(feature.geometry.coordinates)) {
          const { coordinates } = feature.geometry;
          return coordinates;
        }
      }
      return [];
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
    async getLineAltitude(coordinates) {
      const Elevation = new openrouteservice.Elevation({
        api_key: apiKey,
      });
      const result = await Elevation.lineElevation({
        format_in: 'polyline',
        format_out: 'polyline',
        geometry: coordinates,
      });
      if (result && result.geometry) {
        return result.geometry;
      }
      return [];
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
  },

};
</script>

<style scoped>
  @import "~leaflet/dist/leaflet.css";
  @import "../../../vue2-leaflet-height-graph/dist/Vue2LeafletHeightGraph.css";
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
