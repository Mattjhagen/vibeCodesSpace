// Next.js requires the edge middleware to be exported as `middleware` from
// a file literally named `middleware.ts` at the `src/` root.  All the real
// logic lives in `proxy.ts` so it can be imported and unit-tested without
// the Next.js module graph; this shim connects the two.
export { proxy as middleware, config } from './proxy'
