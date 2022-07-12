const query = `
PREFIX sbol2: <http://sbols.org/v2#>

SELECT DISTINCT
      ?source
WHERE {
      <$uri> a ?type .
      OPTIONAL { <$uri> sbol2:source ?source . }
}
`;

export default query;