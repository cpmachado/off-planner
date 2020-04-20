import Vue from 'vue';
import BootstrapVue from 'bootstrap-vue';
import axios from 'axios';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import 'leaflet/dist/leaflet.css';

import App from './App.vue';
import router from './router';
import store from './store';

axios.defaults.baseURL = 'http://localhost:8000';
Vue.prototype.$axios = axios;

Vue.use(BootstrapVue);


Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
