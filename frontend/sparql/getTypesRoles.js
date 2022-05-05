const query = `PREFIX sbol: <http://sbols.org/v2#>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT distinct ?uri WHERE {
 <$uri> sbol:member ?member .
{
  ?member a ?uri .
}
UNION
{
  ?member sbol:type ?uri .
  FILTER(STRSTARTS(str(?uri),'http://www.biopax.org/release/biopax-level3.owl'))
}
UNION
{
  ?member sbol:role ?uri .
  FILTER(STRSTARTS(str(?uri),'http://identifiers.org/so/'))
}
}`;

export default query;