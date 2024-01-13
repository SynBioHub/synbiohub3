const query = `PREFIX sbol2: <http://sbols.org/v2#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX synbiohub: <http://synbiohub.org#>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#>

SELECT DISTINCT
       ?persistentIdentity
       ?displayId 
       ?version
       ?name
       ?description
       (GROUP_CONCAT(DISTINCT ?type; separator=", ") AS ?types)
       (GROUP_CONCAT(DISTINCT ?uploadedBy; separator=", ") AS ?uploadedBys)
       (GROUP_CONCAT(DISTINCT ?creator; separator=", ") AS ?creators)
       (GROUP_CONCAT(DISTINCT ?created; separator=", ") AS ?createdDates)
       (GROUP_CONCAT(DISTINCT ?modified; separator=", ") AS ?modifiedDates)
       (GROUP_CONCAT(DISTINCT ?wasDerivedFrom; separator=", ") AS ?wasDerivedFroms)
       (GROUP_CONCAT(DISTINCT ?wasGeneratedBy; separator=", ") AS ?wasGeneratedBys)
WHERE { 
      <$uri> a ?type .
      OPTIONAL { <$uri> sbol2:persistentIdentity ?persistentIdentity . }
      OPTIONAL { <$uri> sbol2:displayId ?displayId . }
      OPTIONAL { <$uri> sbol2:version ?version . }
      OPTIONAL { <$uri> dcterms:title ?name . }
      OPTIONAL { <$uri> dcterms:description ?description . }
      OPTIONAL { <$uri> dc:creator ?creator . }
      OPTIONAL { <$uri> dcterms:created ?created . }
      OPTIONAL { <$uri> dcterms:modified ?modified . }
      OPTIONAL { <$uri> synbiohub:uploadedBy ?uploadedBy . }
      OPTIONAL { <$uri> prov:wasDerivedFrom ?wasDerivedFrom . }
      OPTIONAL { <$uri> prov:wasGeneratedBy ?wasGeneratedBy . }
}
GROUP BY ?persistentIdentity ?displayId ?version ?name ?description`;

export default query;
