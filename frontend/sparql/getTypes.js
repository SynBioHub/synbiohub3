const query = `PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#>
SELECT DISTINCT
    ?object
$from
WHERE {
    ?subject a ?object .
    ?subject sbh:topLevel ?subject
}`;

export default query;
