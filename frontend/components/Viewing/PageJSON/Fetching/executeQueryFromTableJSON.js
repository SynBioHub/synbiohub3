import getQueryResponse from '../../../../sparql/tools/getQueryResponse';
import buildQuery from './buildQuery';

export default function executeQueryFromTableJSON(
  dispatch,
  uri,
  prefixes,
  table,
  urlOverride
) {
  if (typeof uri === "undefined") {
    uri = "URI is undefined";
  }

  console.log(uri);

  return getQueryResponse(
    dispatch,
    prefixes + '\n' + buildQuery(uri, table),
    { uri },
    '',
    false,
    urlOverride, 
    uri
  );
}
