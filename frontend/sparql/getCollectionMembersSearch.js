const query = `PREFIX sbol2: <http://sbols.org/v2#>
PREFIX dcterms: <http://purl.org/dc/terms/>
SELECT ?uri 
       ?displayId
       ?name
       ?description
       ?type
       ?sbolType
       ?role
$from
WHERE { {
SELECT DISTINCT ?uri 
       ?displayId
       ?name
       ?description
       ?type
       ?sbolType
       ?role

WHERE { 
<$collection> a sbol2:Collection .
<$collection> sbol2:member ?uri .
OPTIONAL { ?uri a ?type . }
OPTIONAL { ?uri sbol2:displayId ?displayId . }
OPTIONAL { ?uri dcterms:title ?name . }
OPTIONAL { ?uri dcterms:description ?description . }
OPTIONAL { ?uri sbol2:type ?sbolType .  FILTER(STRSTARTS(str(?sbolType),'http://www.biopax.org/release/biopax-level3.owl')) }
OPTIONAL { ?uri sbol2:role ?role .  FILTER(STRSTARTS(str(?role),'http://identifiers.org/so/')) }
$search
}
$sort
}}
$limit
$offset
`;

export default query;
