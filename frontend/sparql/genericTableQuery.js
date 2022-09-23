const query = `
PREFIX sbol2: <http://sbols.org/v2#>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT
    ?pred$id
WHERE {
    {
      $subquery
    }
    <$uri> $predicate ?pred$id
}
`;

export default query;