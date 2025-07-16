<template>
  <div class="sensor-logger">
    <p>Sensor stream: {{ connection_status }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useServerStore } from "../stores/useServerStore";

const { buildWsBaseSensorsUrl } = useServerStore();

let ws: WebSocket | null = null;
const connection_status = ref<'connecting' | 'open' | 'closed' | 'error'>('connecting');

onMounted(() => {
  console.log('onmounted iotchart called');
  ws = new WebSocket(buildWsBaseSensorsUrl());

  ws.addEventListener('open', () => {
    connection_status.value = 'open';
    console.log('[SensorLogger] WebSocket opened');
  });

  ws.addEventListener('message', evt => {
    // evt.data is the raw JSON string sent by the server
    console.log('[SensorLogger] Message:\n', evt.data);
    // then parse with smth like const payload = JSON.parse(evt.data) etc.
  });

  ws.addEventListener('close', () => {
    connection_status.value = 'closed';
    console.log('[SensorLogger] WebSocket closed, attempting reconnect in 3s...');
    // simple reconnect logic
    setTimeout(() => {
      connection_status.value = 'connecting';
      // onMounted(); // re-run setup
    }, 3000);
  });

  ws.addEventListener('error', err => {
    connection_status.value = 'error';
    console.error('[SensorLogger] WebSocket error:\n', err);
  });
});

onBeforeUnmount(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
});
</script>

<style scoped>
.sensor-logger {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-family: sans-serif;
}
</style>
