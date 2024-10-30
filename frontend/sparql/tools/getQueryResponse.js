import axios from 'axios';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import loadTemplate from './loadTemplate';
import { addError } from '../../redux/actions';

export default async function getQueryResponse(
  dispatch,
  query,
  options,
  token,
  admin,
  urlOverride
) {

  query = loadTemplate(query, options);

  // console.log("q",query);
  
  const currentURL = window.location.href;
  const isPublic = currentURL.includes('/public/');
  let graphEx = '';
  const regex = /\/user\/([^/]+)\//;
  if (!isPublic) {
    const result = regex.exec(currentURL)[0];
    const lastSlash = result.lastIndexOf('/');
    const graphURL = result.substring(0, lastSlash);
    const uriPrefix = getUrlBeforeThirdSlash(options.uri);
    graphEx = `&default-graph-uri=${uriPrefix}${graphURL}`;
  }

  const params = admin ? '/admin/sparql?query=' : '/sparql?query=';
  const graph = urlOverride ? '' : graphEx;
  const url = `${
    urlOverride || publicRuntimeConfig.backend
  }${params}${encodeURIComponent(query)}${graph}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-authorization': token
  };

  try {
    // if the uri lives in an external sbh, use proxy to
    // circumvent cors errors
    const response = urlOverride
      ? await axios.post('/api/wor-proxy', { url, headers })
      : await axios.get(url, { headers });

    if (response.status === 200) {
      return processResults(response.data);
    } else return;
  } catch (error) {
    error.customMessage = `Request and/or processing failed for SPARQL query`;
    error.fullUrl = `===QUERY===\n\n${query}\n\n===URL===\n\n${url}`;
    dispatch(addError(error));
  }
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

function getUrlBeforeThirdSlash(url) {
  if (typeof url !== 'string') return '';
  let slashCount = 0, result = '';
  for (let i = 0; i < url.length; i++) {
    if (url[i] === '/') slashCount++;
    if (slashCount === 3) break;
    result += url[i];
  }
  return result;
}
