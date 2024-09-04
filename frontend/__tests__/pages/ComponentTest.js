import '@testing-library/jest-dom/extend-expect';

const jsonData = {
    "type": "http://sbols.org/v3#SubComponent",
    "prefixes": [
        "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>",
        "PREFIX dcterms: <http://purl.org/dc/terms/>",
        "PREFIX dc: <http://purl.org/dc/elements/1.1/>",
        "PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#>",
        "PREFIX prov: <http://www.w3.org/ns/prov#>",
        "PREFIX sbol: <http://sbols.org/v3#>",
        "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>",
        "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>",
        "PREFIX purl: <http://purl.obolibrary.org/obo/>"
    ],
    "metadata": [
        {
            "title": "Role Integrations",
            "rootPredicate": "sbol:RoleIntegration",
            "infoLink": "https://sbols.org/v3#roleintegration",
            "icon": "faUserPlus",
            "sections": [
                {
                    "title": "Extra Work",
                    "stripAfter": "#",
                    "predicates": [],
                    "link": "$<roleIntegrationLink>"
                },
                {
                    "title": "roleIntegrationLink",
                    "predicates": [],
                    "hide": true
                }
            ]
        },
        {
            "title": "InstanceOf",
            "rootPredicate": "sbol:instanceOf",
            "infoLink": "https://sbols.org/v3#instanceOf",
            "icon": "faMapPin",
            "sections": [
                {
                    "title": "Component",
                    "stripAfter": "#",
                    "predicates": [
                        "sbol:Component"
                    ],
                    "link": "$<componentLink>"
                },
                {
                    "title": "componentLink",
                    "predicates": [],
                    "hide": true
                }
            ]
        }
    ],
    "tables": [
        {
            "title": "Locations",
            "rootPredicate": "sbol:hasLocation",
            "icon": "faMapMarkerAlt",
            "sections": [
                {
                    "title": "Source Location",
                    "stripAfter": "#",
                    "predicates": [],
                    "link": "$<locationLink>"
                },
                {
                    "title": "locationLink",
                    "predicates": [],
                    "hide": true
                }
            ]
        }
    ],
    "pages": [
        "Details",
        "$TABLES[Locations]",
        "Other Properties",
        "Attachments"
    ]
};

test('Validates JSON structure and key fields', () => {
    // Check if the root type is correct
    expect(jsonData.type).toBe('http://sbols.org/v3#SubComponent');

    // Check prefixes array
    expect(jsonData.prefixes).toHaveLength(9);
    expect(jsonData.prefixes[0]).toBe('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>');

    // Check metadata
    expect(jsonData.metadata).toHaveLength(2);
    expect(jsonData.metadata[0].title).toBe('Role Integrations');
    expect(jsonData.metadata[0].rootPredicate).toBe('sbol:RoleIntegration');
    expect(jsonData.metadata[1].infoLink).toBe('https://sbols.org/v3#instanceOf');

    // Check tables
    expect(jsonData.tables).toHaveLength(1);
    expect(jsonData.tables[0].title).toBe('Locations');
    expect(jsonData.tables[0].rootPredicate).toBe('sbol:hasLocation');

    // Check pages array
    expect(jsonData.pages).toHaveLength(4);
    expect(jsonData.pages[1]).toBe('$TABLES[Locations]');
});
