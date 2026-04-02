const query =`
SELECT
      ?p 
      ?o 
WHERE {
      <$uri>
      ?p
      ?o
      FILTER(!strstarts(str(?p), 'http://sbols.org/') && !strstarts(str(?p), 'http://www.w3.org/ns/prov') &&
      ?p != <http://purl.org/dc/terms/title> && ?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
      ?p != <http://purl.org/dc/terms/description> && ?p != <http://purl.org/dc/elements/1.1/creator> &&
      ?p != <http://purl.org/dc/terms/created> && ?p != <http://purl.org/dc/terms/modified> &&
      !strstarts(str(?p), 'http://wiki.synbiohub.org/wiki/Terms/synbiohub#mutableNotes')&& 
      !strstarts(str(?p), 'http://wiki.synbiohub.org/wiki/Terms/synbiohub#mutableSource') &&
      !strstarts(str(?p), 'http://wiki.synbiohub.org/wiki/Terms/synbiohub#mutableDescription') &&
      !strstarts(str(?p), 'http://wiki.synbiohub.org/wiki/Terms/synbiohub#mutableReferences'))
}

`;


export default query;
