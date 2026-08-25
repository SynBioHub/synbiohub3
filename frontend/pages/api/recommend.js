import axios from 'axios';

/**
 * Server-side proxy for SBOLExplorer's market basket recommendations.
 *
 * Explorer only knows part URIs and scores, so each recommendation is filled out here with the
 * metadata the basket needs to show and re-add it.
 */

const DEFAULT_EXPLORER_ENDPOINT = 'http://localhost:13162/';
const REQUEST_TIMEOUT = 10 * 1000;
const MAX_ENRICHED = 10;

export default async function handler(request, response) {
  const { subject, role, limit } = request.query;
  if (!subject) {
    response.status(400).json({ error: 'subject is required' });
    return;
  }

  const recommendations = await fetchRecommendations(subject, role, limit);
  if (!recommendations) {
    // A missing or unhealthy Explorer means "no suggestions", not a broken basket.
    response.status(200).json({
      recommendations: [],
      matchedCartSize: 0,
      requestedCartSize: subject.split(',').length,
      available: false
    });
    return;
  }

  response.status(200).json({
    ...recommendations,
    available: true,
    recommendations: await enrich(
      (recommendations.recommendations || []).slice(0, MAX_ENRICHED),
      request.headers['x-authorization']
    )
  });
}

const fetchRecommendations = (subject, role, limit) => {
  const endpoint = withTrailingSlash(
    process.env.sbolExplorer || DEFAULT_EXPLORER_ENDPOINT
  );
  return axios
    .get(`${endpoint}recommend`, {
      params: { subject, role, limit },
      timeout: REQUEST_TIMEOUT
    })
    .then(explorerResponse => explorerResponse.data)
    .catch(() => null);
};

/**
 * Looks each recommended part up on the SynBioHub backend. The caller's token is passed along so a
 * user's own private parts resolve; anything that cannot be looked up keeps the identifier from
 * its URI rather than disappearing.
 */
const enrich = (recommendations, token) =>
  Promise.all(
    recommendations.map(async recommendation => ({
      ...identifiersFromUri(recommendation.uri),
      ...(await metadataFor(recommendation.uri, token)),
      uri: recommendation.uri,
      confidence: recommendation.confidence,
      lift: recommendation.lift,
      count: recommendation.count
    }))
  );

const metadataFor = (uri, token) => {
  const path = pathOf(uri);
  if (!path) return {};
  const backend = process.env.backendSS || process.env.backend;
  return axios
    .get(`${backend}${path}/metadata`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { 'X-authorization': token } : {})
      },
      timeout: REQUEST_TIMEOUT
    })
    .then(metadataResponse => {
      const metadata = Array.isArray(metadataResponse.data)
        ? metadataResponse.data[0]
        : metadataResponse.data;
      if (!metadata) return {};
      return {
        displayId: metadata.displayId,
        name: metadata.name,
        version: metadata.version,
        type: metadata.type,
        description: metadata.description
      };
    })
    .catch(() => ({}));
};

/** SynBioHub part URIs end in .../<displayId>/<version>, which is enough to label a suggestion. */
const identifiersFromUri = uri => {
  const segments = pathOf(uri)
    .split('/')
    .filter(segment => segment);
  if (segments.length < 2) return { displayId: uri, name: uri, version: '' };
  const displayId = segments[segments.length - 2];
  return { displayId, name: displayId, version: segments[segments.length - 1] };
};

/** Path of an http(s) part URI, e.g. https://synbiohub.org/public/igem/X/1 -> /public/igem/X/1. */
const pathOf = uri => {
  const withoutScheme = String(uri || '').replace(/^https?:\/\//, '');
  const firstSlash = withoutScheme.indexOf('/');
  return firstSlash === -1 ? '' : withoutScheme.slice(firstSlash);
};

const withTrailingSlash = endpoint =>
  endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
