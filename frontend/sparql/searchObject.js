import SPARQL_PREFIXES from './prefixes';

const query = `${SPARQL_PREFIXES}

SELECT DISTINCT
    ?object
$from
WHERE {
    ?subject $predicate ?object .
    ?subject sbh:topLevel ?subject
}
`;

export default query;
