import type { Preset } from '@/types'

export const presets: Preset[] = [{
  title: 'Parking - (Points / Lines)',
  dateStart: new Date('2023-01-01').toISOString().slice(0, 16),
  dateEnd: new Date('2024-01-01').toISOString().slice(0, 16),
  bbox: '-1.4865185506147705,43.57582751611194,-1.4857594854635559,43.57668833005737',
}, {
  title: 'Bridge Construction Ends - (Lines)',
  dateStart: new Date('2024-01-01').toISOString().slice(0, 16),
  dateEnd: new Date('2024-12-31').toISOString().slice(0, 16),
  bbox: '-0.5420824675324966,44.82039347351967,-0.5393090634110976,44.82208861548204',
}, {
  title: 'Remap Buildings - (Surfaces)',
  dateStart: new Date('2024-01-01').toISOString().slice(0, 16),
  dateEnd: new Date('2024-12-31').toISOString().slice(0, 16),
  bbox: '-1.6537454710167148,42.685107065011486,-1.6509720668953156,42.68686379572838',
}, {
  title: 'Move Node Tags to Way',
  dateStart: new Date('2025-01-01').toISOString().slice(0, 16),
  dateEnd: new Date('2026-01-01').toISOString().slice(0, 16),
  bbox: '1.890431110148569,49.126892511822376,1.8909489817189638,49.127209658721114',
}, {
  title: 'Split highway + Refs',
  dateStart: new Date('2024-01-01').toISOString().slice(0, 16),
  dateEnd: new Date('2024-12-31').toISOString().slice(0, 16),
  bbox: '-1.405801462176413,43.33124243726789,-1.3963476233167,43.33767765881896',
}]
