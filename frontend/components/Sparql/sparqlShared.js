/**
 * Shared helpers for the public and admin SPARQL UIs.
 */

export const LIST_GRAPHS_QUERY = `SELECT DISTINCT ?graph WHERE {
  GRAPH ?graph { ?s ?a ?t }
}`;

export const SPARQL_PREFIXES = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX sbol: <http://sbols.org/v2#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX purl: <http://purl.obolibrary.org/obo/>
PREFIX biopax: <http://www.biopax.org/release/biopax-level3.owl#>
PREFIX so: <http://identifiers.org/so/>
PREFIX bench: <http://wiki.synbiohub.org/wiki/Terms/benchling#>
PREFIX genbank: <http://www.ncbi.nlm.nih.gov/genbank#>

`;

export const REGULAR_GRAPH_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'user', label: 'My Submissions' }
];

export const ADMIN_GRAPH_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'user', label: 'My graph' },
  { value: 'all', label: 'All graphs…' }
];

export function processSparqlResults(results) {
  if (!results || !results.results || !results.results.bindings) {
    return [];
  }
  const headers = results.head?.vars || [];
  return results.results.bindings.map(result => {
    const resultObject = {};
    for (const header of headers) {
      resultObject[header] = result[header] || '';
    }
    return resultObject;
  });
}

/** Extract graph URI strings from a SELECT DISTINCT ?graph result. */
export function graphsFromSparqlBindings(results) {
  const bindings = results?.results?.bindings;
  if (!Array.isArray(bindings)) return [];
  const uris = [];
  for (const row of bindings) {
    const uri = row.graph?.value || row.g?.value;
    if (uri) uris.push(uri);
  }
  return uris;
}

/**
 * Drop Virtuoso/system graphs; optionally keep only URIs under uriPrefix / graphPrefix.
 */
export function filterApplicationGraphs(uris, { uriPrefix, defaultGraph } = {}) {
  return uris.filter(uri => {
    if (!uri) return false;
    const lower = uri.toLowerCase();
    if (
      lower.includes('openlinksw.com/schemas/virtrdf') ||
      lower.includes('www.w3.org/ns/ldp') ||
      lower.includes('www.w3.org/2002/07/owl') ||
      lower.includes('/dav/') ||
      lower.endsWith('/dav') ||
      lower.endsWith('/sparql') ||
      lower.includes('/sparql?')
    ) {
      return false;
    }
    if (defaultGraph && uri === defaultGraph) return true;
    if (uriPrefix && uri.startsWith(uriPrefix)) return true;
    // If we don't know a prefix, keep non-system graphs.
    if (!uriPrefix) return true;
    return false;
  });
}

export function filterGraphsBySearch(uris, search) {
  const q = (search || '').trim().toLowerCase();
  if (!q) return uris;
  return uris.filter(uri => uri.toLowerCase().includes(q));
}

/** Username segment from …/user/{username} or …/user/{username}/… */
export function usernameFromGraphUri(uri) {
  const match = String(uri).match(/\/user\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export function isSparqlUpdate(query) {
  if (!query) return false;
  const stripped = query
    .replace(/^\s*#.*$/gm, '')
    .replace(/^\s*PREFIX\s+\S+\s*<[^>]+>\s*/gim, '')
    .replace(/^\s*BASE\s*<[^>]+>\s*/gim, '')
    .trim();
  return /^(WITH\b|INSERT\b|DELETE\b|LOAD\b|CLEAR\b|CREATE\b|DROP\b|COPY\b|MOVE\b|ADD\b)/i.test(
    stripped
  );
}

/**
 * Resolve the graph URI to send as default-graph-uri.
 * selection: 'public' | 'user' | concrete URI
 */
export function resolveSelectedGraphUri(selection, { defaultGraph, userGraphUri }) {
  if (!selection || selection === 'public') {
    return defaultGraph || '';
  }
  if (selection === 'user') {
    return userGraphUri || '';
  }
  return selection;
}
