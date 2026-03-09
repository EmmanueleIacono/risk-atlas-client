<template>
  <div class="sensor-logger">
    <div class="options-container">
      <button @click="resizeChart" class="chart-btn control-left">Resize</button>

      <div class="sensor-select-wrap control-center">
        <label for="sensor-select" class="sensor-label">Sensor:</label>
        <select id="sensor-select" class="chart-select" v-model="selectedSensorIdRef" :disabled="sensorOptions.length === 0">
          <option v-for="s in sensorOptions" :key="s.sensor_id" :value="s.sensor_id">
            {{ s.name || s.sensor_id }}
          </option>
        </select>
      </div>

      <p class="stream-status control-right">Sensor stream: {{ connection_status }}</p>
    </div>
    <div class="chart-container">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Chart, LineController, LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend } from 'chart.js';
import 'chartjs-adapter-luxon'; // for time axis
import zoomPlugin from 'chartjs-plugin-zoom'; // for zoom & pan
import { useServerStore } from "../stores/useServerStore";
import { useCesiumStore } from "../stores/useCesiumStore";
import { SensorPayload } from "../types/types"

const { buildWsBaseSensorsUrl } = useServerStore();
const { availableSensorsMapRef, selectedSensorsRef } = useCesiumStore();

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  zoomPlugin,
);

let ws: WebSocket | null = null;
let chart: Chart | null = null;
const dataLabels: string[] = [];
const dataPoints: number[] = [];

const connection_status = ref<'connecting' | 'open' | 'closed' | 'error'>('connecting');
const canvasRef = ref<HTMLCanvasElement>();
const selectedSensorIdRef = ref<string>("");

const sensorOptions = computed(() =>
  Array.from(availableSensorsMapRef.value.values()).sort((a, b) =>
    (a.name || a.sensor_id).localeCompare(b.name || b.sensor_id)
  )
);

watch(
  sensorOptions,
  (opts) => {
    if (opts.length === 0) {
      selectedSensorIdRef.value = "";
      return;
    }

    const hasCurrent = opts.some(s => s.sensor_id === selectedSensorIdRef.value);
    if (hasCurrent) return;

    const preferredFromMenu = selectedSensorsRef.value.find(id =>
      opts.some(s => s.sensor_id === id)
    );

    selectedSensorIdRef.value = preferredFromMenu || opts[0].sensor_id;
  },
  {immediate: true}
);

watch(selectedSensorIdRef, (newId, oldId) => {
  if (!newId || newId === oldId) return;
  resetSeriesForSensor(newId);
});

onMounted(async () => {
  // selectedSensorIdRef.value = 'seismograph_001'; // REFACTOR LATER
  await nextTick();
  if (!canvasRef.value) return;

  // init Chart.js
  chart = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels: dataLabels,
      datasets: [{
        label: selectedSensorIdRef.value ? getSensorLabel(selectedSensorIdRef.value) : 'N/A',
        data: dataPoints,
        fill: false,
        tension: 0.1,
        borderColor: 'rgba(0, 200, 255, 0.8)', // bright cyan line
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(0, 200, 255, 1)', // solid dot
        pointBorderColor: 'rgba(255, 200, 255, 0.8)', // white outline
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // allowing CSS to fully size it
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'minute',
            tooltipFormat: 'dd/MM/yy HH:mm',
            displayFormats: {
              minute: 'HH:mm'
            }
          },
          ticks: {
            source: 'auto', // use the time.scale's generated ticks
            stepSize: 15, // one tick every 15 minutes
            autoSkip: false, // do not drop any ticks
            maxRotation: 0, // keep labels horizontal
            major: {
              enabled: true // treating every 4th tick as major
            },
            callback: (val, idx, ticks) => {
              // "ticks[idx].major === true" for every 4th tick
              return ticks[idx].major ? `${new Date(val).getHours().toString().padStart(2, '0')}:00` : '';
            }
          },
          grid: {
            color: ctx => ctx.tick.major ? '#ffffff80' : '#ffffff40'
          },
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Value'
          },
          grid: {
            color: context => {
              if (context.tick.value === 0) return '#ffffff90';
              else return '#ffffff40';
            }
          }
        }
      },
      animation: {
        duration: 0 // animation disabled for live updates
      },
      plugins: {
        legend: {
          display: false
        },
        zoom: {
          pan: { // pan -> drag to scroll
            enabled: true,
            mode: 'x' // allow only on horizontal axis
          },
          zoom: { // zoom in & out
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: false,
            },
            mode: 'y' // allow only on vertical axis
          }
        }
      }
    }
  });

  // open WebSocket
  ws = new WebSocket(buildWsBaseSensorsUrl());

  ws.addEventListener('open', () => {
    connection_status.value = 'open';
    console.log('[SensorLogger] WebSocket opened');
  });

  ws.addEventListener('message', evt => {
    // evt.data is the raw JSON string sent by the server
    console.log('[SensorLogger] Message:\n', evt.data);
    // then parse with smth like const payload = JSON.parse(evt.data) etc.
    try {
      const payload = JSON.parse(evt.data) as SensorPayload;
      if (!selectedSensorIdRef.value) return;
      if (payload.sensor_id !== selectedSensorIdRef.value) return;

      // extract numeric value (if measurement is object, pick a key or skip)
      let val: number;
      if (typeof payload.measurement === 'number') {
        val = payload.measurement;
      } else {
        // if object, take first property [REFACTOR BETTER LATER]
        const first = Object.values(payload.measurement)[0]
        val = typeof first === 'number' ? first : NaN;
      }

      // push new point to chart
      dataLabels.push(payload.timestamp);
      dataPoints.push(val);

      // keep at most N points on chart
      const MAX_POINTS = 50;
      if (dataLabels.length > MAX_POINTS) {
        dataLabels.shift();
        dataPoints.shift();
      }

      chart?.update();
    } catch (e) {
      console.error('Invalid message', e);
    }
  });

  ws.addEventListener('close', () => {
    connection_status.value = 'closed';
    console.log('[SensorLogger] WebSocket closed');
  });

  ws.addEventListener('error', err => {
    connection_status.value = 'error';
    console.error('[SensorLogger] WebSocket error:\n', err);
  });
});

onBeforeUnmount(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    connection_status.value = 'closed';
    ws.close();
  }
  chart?.destroy();
});

function getSensorLabel(sensorId: string) {
  const s = availableSensorsMapRef.value.get(sensorId);
  return s?.name || sensorId;
}

function resizeChart() {
  chart?.resetZoom();
}

function resetSeriesForSensor(sensorId: string) {
  dataLabels.length = 0;
  dataPoints.length = 0;
  if (chart) {
    chart.data.datasets[0].label = getSensorLabel(sensorId);
    chart.update();
  }
}
</script>

<style scoped>
.sensor-logger {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  left: 1rem;
  height: 40vh;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-family: sans-serif;
}

.options-container {
  /*width: 100%;*/
  /*height: 10%;*/
  /*display: inline-flex;*/
  position: relative;
  height: 2.4rem;
  margin-bottom: 0.4rem;
}

.control-left,
.control-center,
.control-right {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.control-left {
  left: 0;
}

.control-center {
  left: 50%;
  transform: translate(-50%, -50%);
}

.control-right {
  right: 0;
}

/* same visual language as your .menu-button */
.chart-btn,
.chart-select {
  background-color: var(--RA-dark-gray);
  color: #fff;
  border: none;
  border-radius: 3px;
  padding: 5px 10px;
  font-size: medium;
}

.chart-btn {
  cursor: pointer;
}

.chart-btn:hover,
.chart-select:hover {
  background-color: var(--RA-light-gray);
}

.chart-btn:active {
  background-color: var(--RA-dark-gray);
}

.chart-select {
  min-width: 220px;
  cursor: pointer;
  outline: none;
}

.chart-select:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.sensor-select-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.sensor-label {
  color: #fff;
  font-size: 0.95rem;
  white-space: nowrap;
}

.stream-status {
  margin: 0;
  padding: 5px 10px;
  background-color: rgba(51, 51, 51, 0.85);
  border-radius: 3px;
  color: #fff;
  font-size: 0.92rem;
  white-space: nowrap;
  text-transform: capitalize;
}

.chart-container {
  width: 100%;
  /* height: 90%; */
  height: calc(100% - 2.8rem);
}

.chart-container canvas {
  width: 100%;
  height: 100%;
}
</style>
