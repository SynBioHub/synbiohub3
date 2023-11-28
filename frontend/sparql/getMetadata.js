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
       ?type
       ?uploadedBy
       ?creator
       ?created
       ?modified
       ?wasDerivedFrom
       ?wasGeneratedBy
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
}`;

export default query;
