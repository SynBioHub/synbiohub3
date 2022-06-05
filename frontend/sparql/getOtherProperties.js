const query =`
SELECT
      ?p 
      ?o 
WHERE {
      <$uri>
      ?p
      ?o
}
`;

export default query;