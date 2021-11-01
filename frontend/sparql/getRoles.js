const query = `PREFIX sbol2: <http://sbols.org/v2#>
PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#>
SELECT DISTINCT
       ?object
$from
WHERE {
    ?tl sbol2:role ?object .
    ?tl sbh:topLevel ?tl
}`;

export default query;
