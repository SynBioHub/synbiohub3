import axios from 'axios';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import loadTemplate from './loadTemplate';
import { addError, logoutUser } from '../../redux/actions';

export default async function getQueryResponse(
  dispatch,
  query,
  options,
  token,
  admin,
  urlOverride
) {
  if (options.uri && options.uri.endsWith('/share')) {
    const parts = options.uri.split('/');
    if (parts.length >= 9) {
      const lastIndex = parts.lastIndexOf("1");
      options.uri = parts.slice(0, lastIndex + 1).join('/');
    }
  }
  query = loadTemplate(query, options);
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

  let shareHashcode = null;
  if (currentURL.endsWith('/share')) {
    // Extract the full path including /share (e.g., /user/dfang97/test1/test1_collection/1/abc123/share)
    try {
      const urlObj = new URL(currentURL);
      const pathname = urlObj.pathname;
      // Keep the full pathname including /share
      if (pathname.endsWith('/share')) {
        shareHashcode = pathname;
      }
    } catch (error) {
      // Fallback: if URL parsing fails, use string manipulation
      const urlParts = currentURL.split('/');
      const shareIndex = urlParts.lastIndexOf('share');
      if (shareIndex > 3) {
        // Reconstruct path starting from after the domain (index 3), including 'share'
        shareHashcode = '/' + urlParts.slice(3, shareIndex + 1).join('/');
      }
    }
  }

  const params = admin ? '/admin/sparql?query=' : '/sparql?query=';
  const graph = urlOverride ? '' : graphEx;
  const sharePath = shareHashcode || '';
  const url = `${urlOverride || publicRuntimeConfig.backend}${sharePath}${params}${encodeURIComponent(query)}${graph}`;
  console.log('url', url);
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-authorization': token
  };
  try {
    // if the uri lives in an external sbh, use proxy to
    // circumvent cors errors
    // const response = urlOverride
    //   ? await axios.post('/api/wor-proxy', { url, headers })
    //   : await axios.get(url, { headers });
    const response = await axios.get(url, { headers });

    if (response && response.status === 200) {
      return processResults(response.data);
    }
    // Non-200 responses will be handled by the catch block via axios throwing
    return;
  } catch (error) {
    // Check if error is specifically related to an undefined user identifier.
    // Do NOT treat generic SPARQL errors (e.g. \"cannot resolve relative IRI <>\")
    // as an undefined user, or we will incorrectly log the user out.
    const errorMessage = error.response?.data?.toString() || '';
    const queryString = query || '';
    const urlString = url || '';
    const hasUndefinedUser =
      errorMessage.toLowerCase().includes('undefineduser') ||
      queryString.toLowerCase().includes('undefineduser') ||
      urlString.toLowerCase().includes('undefineduser');

    if (hasUndefinedUser) {
      // User information is undefined, logout and redirect to login
      console.log('Undefined user detected, logging out user');
      dispatch(logoutUser());
      window.location.href = '/login';
      return;
    }

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
