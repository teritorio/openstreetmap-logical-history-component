// Port of KarmaMap web/lib/parquet.js — canonical source:
// https://github.com/teritorio/KarmaMap/blob/main/web/lib/parquet.js
import type { ParquetQueryFilter } from 'hyparquet'
import { asyncBufferFromUrl, parquetMetadataAsync, parquetQuery } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'

async function fetchFile(baseUrl: string, path: string): Promise<Awaited<ReturnType<typeof asyncBufferFromUrl>> | null> {
  const url = `${baseUrl}/${path}`
  try {
    return await asyncBufferFromUrl({ url })
  }
  catch (err) {
    console.warn(`Skipping ${url}: ${(err as Error).message}`)
    return null
  }
}

async function maybeParseMetadata(file: Awaited<ReturnType<typeof asyncBufferFromUrl>>, footerSize?: number, always = false): Promise<Awaited<ReturnType<typeof parquetMetadataAsync>> | undefined> {
  if (!always && !footerSize)
    return undefined
  return parquetMetadataAsync(file, footerSize ? { initialFetchSize: footerSize + 8 } : undefined)
}

export async function queryRows(
  baseUrl: string,
  path: string,
  filter: ParquetQueryFilter,
  columns?: string[],
  footerSize?: number,
): Promise<Record<string, unknown>[]> {
  const file = await fetchFile(baseUrl, path)
  if (!file)
    return []
  const metadata = await maybeParseMetadata(file, footerSize)
  return parquetQuery({ file, compressors, filter, columns, metadata }) as Promise<Record<string, unknown>[]>
}
