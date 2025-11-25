<template>
  <div class="dashboard">
    <div class="left-panel">
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Building ID</th>
              <th>R</th>
              <th>H</th>
              <th>V</th>
              <th>E</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in dataSet" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.risk.toFixed(2) }}</td>
              <td>{{ item.hazard_mean.toFixed(2) }}</td>
              <td>{{ item.vulnerability.toFixed(2) }}</td>
              <td>{{ item.exposure.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="right-panel">
      <div class="chart-section">
        <div class="chart-row">
          <div class="chart-container large">
            <h3>R (Risk)</h3>
            <canvas ref="riskChartRef"></canvas>
            <div class="legend">
              <div v-for="(label, idx) in scoreLabels" :key="idx" class="legend-item">
                <span :style="{ backgroundColor: chartColors[idx] }"></span> {{ label }}
              </div>
            </div>
          </div>

          <div class="chart-container small-group">
            <div class="chart-small">
              <h4>H (Hazard)</h4>
              <canvas ref="hazardChartRef"></canvas>
            </div>
            <div class="chart-small">
              <h4>V (Vulnerability)</h4>
              <canvas ref="vulnerabilityChartRef"></canvas>
            </div>
            <div class="chart-small">
              <h4>E (Exposure)</h4>
              <canvas ref="exposureChartRef"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Chart, PieController, ArcElement, Tooltip, Legend } from "chart.js";

const chartRefs: Chart[] = [];

Chart.register(PieController, ArcElement, Tooltip, Legend);

// fake data array: TODO: replace with incoming data from API!
// fake data array generator
function generateFakeData(n = 40) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    const randVal = () => Number((Math.random()).toFixed(2));
    const id = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit numeric string

    const hazard_flood = randVal();
    const hazard_landslide = randVal();
    const hazard_seismic = randVal();
    const hazard_mean = Number(((hazard_flood + hazard_landslide + hazard_seismic) / 3).toFixed(2));
    const vulnerability = randVal();
    const exposure = randVal();
    const risk = Number(((hazard_mean + vulnerability + exposure) / 3).toFixed(2));

    arr.push({ id, hazard_flood, hazard_landslide, hazard_seismic, hazard_mean, vulnerability, exposure, risk });
  }
  return arr;
}

const dataSet = ref(generateFakeData(50)); // adjust number if needed

// chart references
const riskChartRef = ref<HTMLCanvasElement | null>(null);
const hazardChartRef = ref<HTMLCanvasElement | null>(null);
const vulnerabilityChartRef = ref<HTMLCanvasElement | null>(null);
const exposureChartRef = ref<HTMLCanvasElement | null>(null);

const chartColors = [
  "rgba(0, 255, 204, 0.7)",
  "rgba(0, 200, 180, 0.7)",
  "rgba(0, 150, 150, 0.7)",
  "rgba(0, 100, 120, 0.7)"
];

const scoreLabels = [
  "0.00 - 0.25 (Very Low)",
  "0.25 - 0.50 (Low-Medium)",
  "0.50 - 0.75 (Medium-High)",
  "0.75 - 1.00 (Very High)"
];

// helper to bucketize scores
function getBuckets(values: number[]) {
  const buckets = [0, 0, 0, 0];
  for (const val of values) {
    if (val <= 0.25) buckets[0]++;
    else if (val <= 0.5) buckets[1]++;
    else if (val <= 0.75) buckets[2]++;
    else buckets[3]++;
  }
  return buckets;
}

onMounted(() => {
  const hazardBuckets = getBuckets(dataSet.value.map(d => d.hazard_mean));
  const vulnerabilityBuckets = getBuckets(dataSet.value.map(d => d.vulnerability));
  const exposureBuckets = getBuckets(dataSet.value.map(d => d.exposure));
  const riskBuckets = getBuckets(dataSet.value.map(d => d.risk));

  const makePieChart = (ctx: HTMLCanvasElement | null, buckets: number[]) => {
    if (!ctx) return;
    const chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: scoreLabels,
        datasets: [{
          data: buckets,
          backgroundColor: chartColors,
          borderWidth: 1,
          borderColor: "#222"
        }]
      },
      options: {
        // responsive: true,
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed}`
            }
          }
        }
      }
    });
    chartRefs.push(chart);
  };

  makePieChart(riskChartRef.value, riskBuckets);
  makePieChart(hazardChartRef.value, hazardBuckets);
  makePieChart(vulnerabilityChartRef.value, vulnerabilityBuckets);
  makePieChart(exposureChartRef.value, exposureBuckets);

  window.addEventListener("resize", () => {
    chartRefs.forEach(c => c.resize());
  });
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: row;
  height: calc(100vh - 20rem);
  width: calc(100vw - 20rem);
  margin: 1rem;
  overflow: hidden;
  color: white;
  font-family: sans-serif;
  box-sizing: border-box;
}

.chart-container canvas {
  /* width: 70% !important; */
  width: 70% !important;
  /* height: auto !important; */
  height: 70% !important;
  justify-self: center;
}

.left-panel {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  overflow-y: hidden; /* prevents global overflow */
}

.data-table {
  width: 100%;
  height: 90%;
  border-collapse: collapse;
  text-align: center;
  overflow-y: auto;
}

.data-table th,
.data-table td {
  border: 2px solid rgba(0, 255, 204, 0.5);
  padding: 0.5rem;
}

/* .data-table th {
  background: rgba(0, 255, 204, 0.5);
} */

.data-table thead th {
    position: sticky;
    top: 0;
    background: rgba(0, 255, 204, 0.5);
}

.data-table-container {
    flex: 1;
    overflow-y: auto;
    max-height: 100%;
}

.right-panel {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.chart-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.chart-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  gap: 2rem;
  width: 100%;
}

.chart-container.large {
  width: 80%;
  margin-bottom: 1.5rem;
}

.chart-container.large h3 {
  text-align: center;
  margin-bottom: 0.5rem;
}

.legend {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-self: center;
  margin-top: 3rem;
  gap: 0.3rem;
  font-size: 0.8rem;
}

.legend-item {
  display: flex;
  align-items: center;
}

.legend-item span {
  display: inline-block;
  /* width: 1rem; */
  width: 100px;
  /* height: 1rem; */
  height: 30px;
  margin-right: 1rem;
}

.chart-container.small-group {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 30%;
}

.chart-small {
  width: 100%;
  margin-bottom: 1rem;
}

.chart-small h4 {
  margin-bottom: 0.5rem;
}
</style>
