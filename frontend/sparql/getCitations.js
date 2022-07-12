const query = `
PREFIX purl: <http://purl.obolibrary.org/obo/>

SELECT DISTINCT
    ?citation
WHERE {
    <$uri> a ?type .
    OPTIONAL { <$uri> purl:OBI_0001617 ?citation . }
}
`;

export default query;