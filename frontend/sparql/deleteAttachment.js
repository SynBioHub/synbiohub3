const query = `
DELETE WHERE {
  GRAPH ?g {
    ?s
    ?p 
    <$uri> 
  }
}`;

export default query;