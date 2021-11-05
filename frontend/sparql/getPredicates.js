const query = `PREFIX sbol2: <http://sbols.org/v2#>
PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#>
SELECT DISTINCT
       ?predicate
$from
WHERE {
      ?subject ?predicate ?object .
      ?subject sbh:topLevel ?subject
}`;

export default query;
