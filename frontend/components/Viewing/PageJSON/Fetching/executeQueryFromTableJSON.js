import getQueryResponse from '../../../../sparql/tools/getQueryResponse';
import buildQuery from './buildQuery';

export default function executeQueryFromTableJSON(
  uri,
  prefixes,
  table,
  urlOverride
) {
  return getQueryResponse(
    prefixes + '\n' + buildQuery(uri, table),
    {},
    '',
    false,
    urlOverride
  );
}
