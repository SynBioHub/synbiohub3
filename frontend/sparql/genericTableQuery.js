const query = `
PREFIX sbol2: <http://sbols.org/v2#>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT
    ?access
WHERE {
    <https://synbiohub.org/public/igem/BBa_K1001752/1> sbol2:component ?component
    OPTIONAL { ?component sbol2:access ?access . }
}
`;

/*
SELECT
    $predicate
WHERE {
    <$uri> sbol2:component ?component
    OPTIONAL { ?component sbol2:access ?access . }
}

*/