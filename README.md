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

| Prop              | Type          | Default     | Description                                                   |
| ----------------- | ------------- | ----------- | ------------------------------------------------------------- |
| `data`            | `ApiResponse` | `undefined` | The API response containing features and metadata to display. |
| `reasonCollapsed` | `boolean`     | `true`      | Whether conflation reason details are collapsed by default.   |

### Slots

#### `#tags-diff`

A scoped slot exposed on each feature group, allowing custom rendering of tag diffs.

Slot props (always present):

| Prop     | Type                     | Description                                                                                                               |
| -------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `date`   | `string`                 | The feature's creation date.                                                                                              |
| `diff`   | `Actions`                | The tag diff actions.                                                                                                     |
| `reason` | `Reason`                 | The conflation reason.                                                                                                    |
| `src`    | `IFeature['properties']` | Source feature properties. On "before" features this is the feature itself; on "after" it is the linked "before" feature. |

Additional slot props on "after" features only:

| Prop    | Type                     | Description                             |
| ------- | ------------------------ | --------------------------------------- |
| `title` | `string`                 | A label for the tag diff.               |
| `dst`   | `IFeature['properties']` | Destination (after) feature properties. |

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
  IFeature,
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
