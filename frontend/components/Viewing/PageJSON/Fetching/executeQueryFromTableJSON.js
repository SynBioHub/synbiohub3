import getQueryResponse from '../../../../sparql/tools/getQueryResponse';
import buildQuery from './buildQuery';

export default function executeQueryFromTableJSON(
  dispatch,
  uri,
  prefixes,
  token,
  table,
  urlOverride
) {
  if (typeof uri === "undefined") {
    uri = "URI is undefined";
  }

  return getQueryResponse(
    dispatch,
    prefixes + '\n' + buildQuery(uri, table),
    { uri },
    token,
    false,
    urlOverride, 
    uri
  );
}
