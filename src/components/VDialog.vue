<script setup lang="ts">
import { Dialog } from '@ark-ui/vue'
</script>

<template>
  <Teleport to="body">
    <Dialog.Backdrop class="dialog-backdrop" />
    <Dialog.Positioner class="dialog-positioner">
      <Dialog.Content class="dialog-content">
        <Dialog.CloseTrigger class="dialog-close" aria-label="Close">
          ✕
        </Dialog.CloseTrigger>
        <Dialog.Title class="dialog-title">
          OpenStreetMap Logical History
        </Dialog.Title>
        <p>
          OpenStreetMap changes are recorded in technical formats that are difficult for humans to interpret.
          For example, a "school" object might appear as a separate "deleted node" and "created polygon" entries,
          when in reality it was simply redrawn with more detail. Similarly, a highway may be split to support
          different tags. This project presents changes as a "semantic history," translating technical changes
          into meaningful summaries.
        </p>

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
            Read the full story:
            <a href="https://github.com/teritorio/openstreetmap-logical-history/blob/master/doc/OSM-Logical-History-From-technical-diffs-to-reconstructed-semantic-object-history.md" target="_blank" rel="noopener noreferrer">medium.com — full article</a>.
          </p>
          <p>
            Hack the code on GitHub:
            <a href="https://github.com/teritorio/openstreetmap-logical-history" target="_blank" rel="noopener noreferrer">
              teritorio / openstreetmap-logical-history
            </a>
          </p>
        </section>

        <section aria-labelledby="limitations">
          <h3 id="limitations">
            Limitations
          </h3>
          <p>
            The OSM relations are not fetched from history data to avoid deal with large objects.
          </p>
        </section>

        <footer>
          <p>Released under <a href="https://www.gnu.org/licenses/agpl-3.0.en.html" target="_blank" rel="noopener noreferrer">AGPL-3.0</a> by Teritorio.</p>
        </footer>
      </Dialog.Content>
    </Dialog.Positioner>
  </Teleport>
</template>

<style lang="css" scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.dialog-positioner {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 11;
  padding: var(--space-4);
}

.dialog-content {
  position: relative;
  width: 60%;
  max-width: 680px;
  max-height: 80vh;
  overflow-y: auto;
  background: var(--color-bg);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  color: var(--color-text);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.dialog-title {
  font-size: var(--text-xl);
  font-weight: 600;
  padding-right: var(--space-6);
}

.dialog-close {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  background: none;
  border: none;
  font-size: var(--text-lg);
  cursor: pointer;
  color: var(--color-text-secondary);
  line-height: 1;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
}

.dialog-close:hover {
  color: var(--color-text);
  background: var(--color-bg-hover);
}

section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

ol {
  padding-left: var(--space-4);
}

@media (max-width: 767px) {
  .dialog-content {
    width: 90%;
  }
}
</style>
