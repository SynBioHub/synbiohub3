const query = `
PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#>

SELECT DISTINCT
      ?ownedBy
WHERE {
      <$uri> a ?type .
      OPTIONAL { <$uri> sbh:ownedBy ?ownedBy . }
}
`;

export default query;