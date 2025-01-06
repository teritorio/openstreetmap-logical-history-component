<script setup lang="ts">
import { useLoCha } from '@/composables/useLoCha'

const { featureAfter, featureBefore } = useLoCha()
</script>

<template>
  <section>
    <h3>Tags</h3>
    <table v-if="featureBefore && Object.values(featureBefore?.properties?.tags).length">
      <thead>
        <tr>
          <th>Key</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="([key, value]) in Object.entries(featureBefore?.properties?.tags)" :key="key">
          <td>{{ key }}</td>
          <td>{{ value }}</td>
        </tr>
      </tbody>
    </table>
    <table v-if="featureAfter && Object.values(featureAfter?.properties?.tags).length">
      <thead>
        <tr>
          <th>Key</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="([key, value]) in Object.entries(featureAfter?.properties?.tags)" :key="key">
          <td>{{ key }}</td>
          <td>{{ value }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style lang="css" scoped>
section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
}

table {
  width: 50%;
  border-collapse: collapse;
  background-color: #ffffff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

thead {
  background-color: #cecece;
  color: #ffffff;
}

th,
td {
  padding: 12px 15px;
  text-align: left;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

tbody tr:hover {
  background-color: #f1f1f1;
}

th {
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
</style>
