# off-planner
Map routing application for outdoor activities, using Vue.js, Leaflet, the Open Route Service API.

## This project depends on vue-bootstrap-template-2020
In order to keep up to date with upstream:
```
git pull
git remote add upstream git@github.com:niabb/vue-bootstrap-template-2020.git // If not done already
git pull upstream master
```

## Project setup
```
npm install
```
### Setup the config
Obtain an API key from Thunderforest and from Open Route Service, and enter them in the config file:
```
cp src/config.defaul.json src/config.json
# Add the keys to config.json
```


### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
