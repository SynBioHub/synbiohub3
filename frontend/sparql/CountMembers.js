const query = `PREFIX sbol2: <http://sbols.org/v2#>
PREFIX dcterms: <http://purl.org/dc/terms/>
SELECT (COUNT(DISTINCT ?uri) AS ?count)
$graphs
WHERE {
<$collection> sbol2:member ?uri .
OPTIONAL { ?uri a ?type . }
OPTIONAL { ?uri sbol2:displayId ?displayId . }
OPTIONAL { ?uri dcterms:title ?name . }
OPTIONAL { ?uri dcterms:description ?description . }
FILTER(STRSTARTS(str(?uri), '$graphPrefix'))
FILTER NOT EXISTS {
<$collection> sbol2:member ?otherMember .
{
?otherMember ?ref ?uri .
}
UNION
{
?otherMember ?ref ?child .
?child ?childRef ?uri .
}
FILTER(?otherMember != ?uri)
}
$search
}
`;

export default query;
