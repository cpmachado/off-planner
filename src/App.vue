<template>
  <div id="app" class="d-flex flex-column h-100">
    <b-navbar toggleable="lg" type="dark" variant="dark">
      <b-navbar-brand to="/">NavBar</b-navbar-brand>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item to="/">Home</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <b-container fluid class="d-flex flex-column flex-grow h-100">
      <router-view/>
    </b-container>
  </div>
</template>

<style>
  html, body {
    height: 100%;
    margin: 0;
  }
</style>
