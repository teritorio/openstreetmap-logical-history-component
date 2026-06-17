# OpenStreetMap logical history (LoCha) UI component

A Vue-based UI component for visualizing and interacting with OpenStreetMap logical history data.

## Usage

### Installation

```bash
npm install @teritorio/openstreetmap-logical-history-component
# or
yarn add @teritorio/openstreetmap-logical-history-component
```

#### Peer dependencies

The component requires `vue` and `maplibre-gl` as peer dependencies:

```bash
npm install vue maplibre-gl
```

### Importing

```ts
import { LoCha } from '@teritorio/openstreetmap-logical-history-component'
import '@teritorio/openstreetmap-logical-history-component/style.css'
```

### Basic example

```vue
<script setup lang="ts">
import type { ApiResponse } from '@teritorio/openstreetmap-logical-history-component'
import { LoCha } from '@teritorio/openstreetmap-logical-history-component'
import { ref } from 'vue'

const data = ref<ApiResponse>()

// Fetch data from your API and assign it to `data`
</script>

<template>
  <LoCha :data="data" />
</template>
```

### Props

| Prop              | Type          | Default     | Description                                                                    |
| ----------------- | ------------- | ----------- | ------------------------------------------------------------------------------ |
| `id`              | `string`      | —           | **Required.** A unique, deterministic identifier used to build anchor targets. |
| `data`            | `ApiResponse` | `undefined` | The API response containing features and metadata to display.                  |
| `reasonCollapsed` | `boolean`     | `true`      | Whether conflation reason details are collapsed by default.                    |

### Slots

All slots are optional and receive generic, position-based props. The LoCha component does not perform domain-specific data lookups — consumers are responsible for their own data processing.

#### `#object-detail`

A scoped slot rendered once per feature inside each object card. Use it to display tag diffs, validation status, or any per-feature content.

| Prop      | Type       | Description              |
| --------- | ---------- | ------------------------ |
| `feature` | `IFeature` | The feature being shown. |
| `index`   | `number`   | The group index.         |

#### `#header-center`

A scoped slot rendered once per group in the center of the group header (between the group name and the end slot).

| Prop    | Type     | Description      |
| ------- | -------- | ---------------- |
| `index` | `number` | The group index. |

#### `#header-start-end`

A scoped slot rendered once per group inside the left section of the group header, between the anchor button (🔗) and the group name. Useful for injecting a per-group action button close to the anchor.

| Prop    | Type     | Description      |
| ------- | -------- | ---------------- |
| `index` | `number` | The group index. |

#### `#header-end`

A scoped slot rendered once per group at the right end of the group header. Useful for injecting per-group action buttons (e.g. accept/reject validation).

| Prop    | Type     | Description      |
| ------- | -------- | ---------------- |
| `index` | `number` | The group index. |

#### `#content-start`

A scoped slot rendered once per group as the first column (before the "before" column). When provided, the grid switches from 3 to 4 columns. When omitted, the layout remains unchanged at 3 columns.

| Prop    | Type     | Description      |
| ------- | -------- | ---------------- |
| `index` | `number` | The group index. |

Example usage:

```vue
<LoCha :data="data" map-style-url="...">
  <template #object-detail="{ feature, index }">
    <!-- Custom per-feature rendering -->
  </template>
  <template #header-start-end="{ index }">
    <button @click="acceptGroup(index)">Accept</button>
  </template>
  <template #header-end="{ index }">
    <!-- Optional: action at the far right of the group header -->
  </template>
  <template #content-start="{ index }">
    <!-- Custom first-column content (e.g. changesets) -->
  </template>
</LoCha>
```

### Types

All consumer-facing types are exported from the package entry point:

```ts
import type {
  Action,
  Actions,
  ActionType,
  ApiLink,
  ApiLinkGroups,
  ApiResponse,
  Changeset,
  GroupSlotProps,
  IFeature,
  ObjectDetailSlotProps,
  Reason,
  ReasonGeom,
  ReasonTags,
} from '@teritorio/openstreetmap-logical-history-component'
```

### `ApiResponse` shape

`ApiResponse` extends `GeoJSON.FeatureCollection` with:

- `features` — an array of `IFeature` objects (GeoJSON features with OSM-specific properties such as `objtype`, `version`, `username`, `tags`, etc.)
- `metadata.links` — a record mapping link group IDs to arrays of `ApiLink` objects describing before/after relationships between features
- `metadata.changesets` — an array of OSM changeset objects

## Development

### Prerequisites

- Node.js (v20.19+ or v22.12+)
- Yarn 2+ package manager

### Setup

1. **Set up environment variables**

   Copy the example environment file and configure it with your settings:

```bash
   cp .env .env.local
```

Update `.env.local` with your configuration values.

2. **Install dependencies**

```bash
   yarn install
```

3. **Start the development server**

```bash
   yarn dev
```

The demo page will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Contributing

We welcome contributions! Please see our [contribution guide](CONTRIBUTING.md) for details on how to get started.

## Author

Developed and maintained by [Teritorio](https://teritorio.fr)
