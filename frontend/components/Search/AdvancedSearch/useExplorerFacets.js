import axios from 'axios';
import getConfig from 'next/config';
import { useSelector } from 'react-redux';
import useSWR from 'swr';

const { publicRuntimeConfig } = getConfig();

// Our facet names -> the parameter names SBOLExplorer's /facets expects.
const FACET_PARAMS = {
  role: 'role',
  sbolType: 'sboltype',
  objectType: 'type',
  creator: 'creator',
  collections: 'collections'
};

const fetcher = (url, token) =>
  axios
    .get(url, {
      headers: { Accept: 'application/json', 'X-authorization': token }
    })
    .then(response => response.data);

/**
 * Facet counts and the result total from SBOLExplorer's Elasticsearch index,
 * via the backend's /facets (which adds the user's graphs). One request
 * replaces the five per-facet SPARQL queries plus the count query, and uses
 * the same text match as the result list, so the numbers agree with it.
 *
 * Returns { available: false } when it cannot be used, so callers fall back
 * to SPARQL: free-form "Add Filter" filters are set (/facets cannot express
 * them), or the backend answers with an error (SBOLExplorer disabled, or an
 * SBOLExplorer without /facets).
 *
 * selections: { role, sbolType, objectType, creator, collections, extraFilters }
 */
export default function useExplorerFacets(query, selections, enabled = true) {
  const token = useSelector(state => state.user.token);
  const hasExtraFilters = (selections.extraFilters || []).some(
    filter => filter.filter && filter.value
  );
  const usable = enabled && !hasExtraFilters;

  const params = new URLSearchParams();
  if (query) params.set('query', query);
  for (const [name, param] of Object.entries(FACET_PARAMS)) {
    const value = selections[name];
    if (name === 'collections') {
      for (const collection of value || []) params.append(param, collection.value);
    } else if (value) {
      params.set(param, value);
    }
  }
  const url = `${publicRuntimeConfig.backend}/facets?${params.toString()}`;

  const { data, error } = useSWR(usable ? [url, token] : null, fetcher, {
    shouldRetryOnError: false
  });

  if (!usable || error) return { available: false };
  return {
    available: true,
    loading: data === undefined,
    found: data?.found,
    facets: data?.facets || {}
  };
}
