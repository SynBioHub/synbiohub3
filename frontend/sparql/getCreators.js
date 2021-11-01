const query = `PREFIX dc: <http://purl.org/dc/elements/1.1/>
SELECT DISTINCT
       ?object
$from
WHERE {
      ?tl dc:creator ?object
}`;

export default query;
