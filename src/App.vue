<template>
  <CesiumViewer />
  <MenuContainer />
  <MetadataTooltip />
</template>

<script setup lang="ts">
import CesiumViewer from "./components/CesiumViewer.vue";
import MenuContainer from "./components/MenuContainer.vue";
import MetadataTooltip from "./components/MetadataTooltip.vue";
</script>

<style>
body {
  margin: 0;
  padding: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

hr {
  height: 2px;
  width: 70%;
  border: none;
  background-color: #464646;
  color: #464646;
}

.proj-menu-container {
  margin: 15px 0 10px;
}

.menu-details {
  justify-content: left;
}

.menu-summary {
  font-weight: bold;
}

.options-container {
  padding-left: 10px;
  max-height: 50vh;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: #2f2f2f #464646;
}

.menu-input {
  margin: 10px 0;
  accent-color: #000;
}

.menu-button {
  width: 100%;
  display: block;
  border: none;
  font-size: medium;
}

.options-container div {
  width: fit-content;
  padding-left: 10px;
}

.menu-button, .menu-summary, .options-container div {
  background-color: #333;
}

.menu-button:hover, .menu-summary:hover {
  background-color: #4e4d4d;
}

.menu-button:active {
  background-color: #333;
}

.menu-button, .menu-summary, .menu-input {
  margin-bottom: 5px;
  padding: 5px 10px;
  color: #fff;
  border-radius: 3px;
  cursor: pointer;
  font-size: medium;
  text-align: left;
}

.menu-input:disabled {
  cursor: not-allowed;
}
</style>
