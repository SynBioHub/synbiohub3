const query = `
PREFIX sbol2: <http://sbols.org/v2#>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT
  ?start
  ?end
  ?persistentIdentity
  ?location
  ?title
	?def
	?definition
WHERE 
{
	{
		SELECT
			?start
			?end
			?persistentIdentity
			?location
			?title
		WHERE 
		{
			{
				SELECT
					?location
					?persistentIdentity
					?title
				WHERE 
				{
					{
						SELECT
							?sequenceAnnotation
						WHERE 
						{
							<$uri> sbol2:sequenceAnnotation ?sequenceAnnotation
						}
					}
					OPTIONAL { ?sequenceAnnotation sbol2:persistentIdentity ?persistentIdentity . }
					OPTIONAL { ?sequenceAnnotation sbol2:location ?location . }
					OPTIONAL { ?sequenceAnnotation dcterms:title ?title . }
				}
			}
			OPTIONAL { ?location sbol2:start ?start . }
			OPTIONAL { ?location sbol2:end ?end . }
		}
	}
	UNION
	{
		SELECT
			?definition
			?def
		WHERE {
    {
      SELECT
        ?instance
        ?component
      WHERE {
        {
          SELECT
            ?component
          WHERE {
            <$uri> sbol2:component ?component
          }
        }
        OPTIONAL { ?component sbol2:definition ?instance . }
      }
		}
		OPTIONAL { ?instance dcterms:title ?definition . }
		OPTIONAL { ?component sbol2:definition ?def . }
		}
	}
}
`;

export default query;

/*

*/
