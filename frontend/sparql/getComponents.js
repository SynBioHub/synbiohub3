const query = `
PREFIX sbol2: <http://sbols.org/v2#>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT
  ?definition
  ?access
  ?title
  ?component
  ?def
WHERE {
    {
      SELECT
        ?instance
        ?access
        ?title
        ?component
      WHERE {
        {
          SELECT
            ?component
            ?access
            ?title
          WHERE {
            <$uri> sbol2:component ?component
            OPTIONAL { ?component sbol2:access ?access . }
            OPTIONAL { ?component dcterms:title ?title . }
          }
        }
        OPTIONAL { ?component sbol2:definition ?instance . }
      }
  }
  OPTIONAL { ?instance dcterms:title ?definition . }
  OPTIONAL { ?component sbol2:definition ?def . }
}
`;

export default query;
