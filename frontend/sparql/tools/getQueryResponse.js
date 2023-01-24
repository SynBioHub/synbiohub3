import getConfig from 'next/config';

import loadTemplate from './loadTemplate';
const { publicRuntimeConfig } = getConfig();

export default async function getQueryResponse(query, options, token, admin) {
  query = loadTemplate(query, options);

  console.log(query);

  const params = admin ? '/admin/sparql?query=' : '/sparql?query=';
  const graph = ''; // '&default-graph-uri=https://synbiohub.org/user/benjhatch7';
  const url = `${publicRuntimeConfig.backend}${params}${encodeURIComponent(
    query
  )}${graph}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-authorization': token
  };

  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  if (response.status === 200) {
    const results = await response.json();
    console.log(results);
    console.log(token, processResults(results));
    return processResults(results);
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
