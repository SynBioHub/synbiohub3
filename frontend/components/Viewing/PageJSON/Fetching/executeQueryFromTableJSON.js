import getQueryResponse from '../../../../sparql/tools/getQueryResponse';
import buildQuery from './buildQuery';

export default function executeQueryFromTableJSON(
  dispatch,
  uri,
  prefixes,
  table,
  urlOverride
) {
  return getQueryResponse(
    dispatch,
    prefixes + '\n' + buildQuery(uri, table),
    {},
    '',
    false,
    urlOverride
  );
}
