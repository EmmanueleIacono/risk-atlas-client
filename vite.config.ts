import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import cesium from "vite-plugin-cesium";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    cesium({
      cesiumBaseUrl: "cesium"
    }),
    {
      // additional "custom" plugin to fix cesium relative links issue
      name: "fix-cesium-links",
      enforce: "post", // this ensures that this plugin runs after the cesium plugin
      transformIndexHtml(html) {
        // replacing "cesium/" link paths with "./cesium/" paths
        return html.replace(/(href|src)="cesium\//g, '$1="./cesium/');
      }
    }
  ],
  base: "./",
});
