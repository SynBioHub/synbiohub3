import axios from 'axios';
import getConfig from 'next/config';

import loadTemplate from './loadTemplate';
const { publicRuntimeConfig } = getConfig();

export default async function getQueryResponse(
  query,
  options,
  token,
  admin,
  urlOverride
) {
  query = loadTemplate(query, options);

  const params = admin ? '/admin/sparql?query=' : '/sparql?query=';
  const graph = urlOverride
    ? ''
    : '&default-graph-uri=https://synbiohub.org/user/benjhatch7';
  const url = `${
    urlOverride || publicRuntimeConfig.backend
  }${params}${encodeURIComponent(query)}${graph}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-authorization': token
  };

  // if the uri lives in an external sbh, use proxy to
  // circumvent cors errors
  const response = urlOverride
    ? await axios.post('/api/wor-proxy', { url, headers })
    : await axios.get(url, { headers });

  if (response.status === 200) {
    return processResults(response.data);
  } else return;
}

const processResults = results => {
  const headers = results.head.vars;
  return results.results.bindings.map(result => {
    const resultObject = {};
    for (const header of headers) {
      if (result[header]) resultObject[header] = result[header].value;
      else resultObject[header] = '';
    }
    return resultObject;
  });
};
