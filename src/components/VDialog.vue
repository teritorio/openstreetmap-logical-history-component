<script setup lang="ts">
defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <dialog open>
    <header>
      <button @click="$emit('close')">
        X Close
      </button>
      <h2>OpenStreetMap Logical History</h2>
      <p>
        OpenStreetMap changes are recorded in technical formats that are difficult for humans to interpret.
        For example, a “school” object might appear as a separate “deleted node” and “created polygon” entries,
        when in reality it was simply redrawn with more detail. Similarly, a highway may be split to support
        different tags. This project presents changes as a “semantic history,” translating technical changes
        into meaningful summaries.
      </p>
    </header>
    <section aria-labelledby="conflation">
      <h3 id="conflation">
        Conflation approach
      </h3>
      <p>
        The system performs conflation of OSM objects at the semantic level between two points in time.
        Conflation is based on tags and geometry; OSM technical IDs are used as a supporting reference,
        but are not the central reference.
      </p>
    </section>

    <section aria-labelledby="how-to-use">
      <h3 id="how-to-use">
        How to use it
      </h3>
      <ol>
        <li>Select two points in time to compare OSM data. The second point may be left empty to represent <em>now</em>.</li>
        <li>Select an area to run the comparison on.</li>
        <li>Run the comparison.</li>
      </ol>
      <p>
        Both the time range and area are limited to reduce the required data and computation time.
        The OSM data comes from the Overpass API Attic data (
        <a href="https://overpass-api.de/" target="_blank" rel="noopener noreferrer">overpass-api.de</a>)
        or the Ohsome API (<a href="https://docs.ohsome.org/ohsome-api/v1/" target="_blank" rel="noopener noreferrer">ohsome.org</a>),
        which may impose usage limitations.
      </p>
    </section>

    <section aria-labelledby="how-it-works">
      <h3 id="how-it-works">
        How it works
      </h3>
      <p>
        Read the full story on Medium:
        <a href="https://medium.com/p/eea089a6d72e/edit" target="_blank" rel="noopener noreferrer">medium.com — full article</a>.
      </p>
      <p>
        Hack the code on GitHub:
        <a href="https://github.com/teritorio/openstreetmap-logical-history" target="_blank" rel="noopener noreferrer">
          teritorio / openstreetmap-logical-history
        </a>
      </p>
    </section>

    <footer>
      <p>Released under <a href="https://www.gnu.org/licenses/agpl-3.0.en.html" target="_blank" rel="noopener noreferrer">AGPL-3.0</a> by Teritorio.</p>
    </footer>
  </dialog>
</template>

<style lang="css" scoped>
dialog {
  position: fixed;
  z-index: 10;
  width: 60%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 1rem;
  max-height: 80%;
  overflow-y: scroll;
}

button {
  float: right;
}

ol {
  padding-left: 1rem;
}

h2,
section,
header {
  margin-bottom: 1rem;
}
</style>
