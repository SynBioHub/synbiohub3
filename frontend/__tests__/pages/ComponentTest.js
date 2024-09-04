import '@testing-library/jest-dom/extend-expect';

const jsonData ={
    "type": "http://sbols.org/v3#Component",
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
            "title": "Type",
            "rootPredicate": "sbol:type",
            "icon": "faPalette",
            "sections": [
                {
                    "title": "Extra Work",
                    "stripAfter": "#",
                    "predicates": [],
                    "link": "$<typeLink>"
                },
                {
                    "title": "typeLink",
                    "predicates": [],
                    "hide": true
                }
            ]
        },
        {
            "title": "Role",
            "rootPredicate": "sbol:role",
            "icon": "faUserTag",
            "sections": [
                {
                    "title": "Extra Work",
                    "stripAfter": "#",
                    "predicates": [],
                    "link": "$<roleLink>"
                },
                {
                    "title": "roleLink",
                    "predicates": [],
                    "hide": true
                }
            ]
        }
    ],
    "tables": [
        {
            "title": "Sequences",
            "rootPredicate": "sbol:hasSequence",
            "icon": "faDna",
            "sections": [
                {
                    "title": "Sequence",
                    "stripAfter": "#",
                    "predicates": [
                        "sbol:Sequence"
                    ],
                    "link": "$<SequenceLink>"
                },
                {
                    "title": "SequenceLink",
                    "predicates": [],
                    "hide": true
                }
            ]
        },
        {
            "icon": "faThLarge",
            "title": "Features",
            "rootPredicate": "sbol:hasFeature",
            "sections": [
                {
                    "title": "SubComponents",
                    "infoLink": "https://sbols.org/v3#SubComponent",
                    "predicates": [
                        "rdf:type"
                    ],
                    "stripAfter": "#",
                    "link": "$<subcomponentLink>"
                },
                {
                    "title": "subcomponentLink",
                    "predicates": [
                    ],
                    "hide": true
                }
            ]
        },
        {
            "icon": "faHandshake",
            "title": "Interactions",
            "rootPredicate": "sbol:hasInteraction",
            "sections": [
                {
                    "title": "Type",
                    "infoLink": "https://sbols.org/v3#Interaction",
                    "predicates": [
                    ],
                    "link": "$<interactionLink>"
                },
                {
                    "title": "interactionLink",
                    "predicates": [],
                    "hide": true
                }
            ]
        },
        {
            "title": "Sequence Constraints",
            "rootPredicate": "sbol:hasConstraint",
            "icon": "faVirusSlash",
            "sections": [
                {
                    "title": "Sequence Constraint",
                    "infoLink": "https://sbols.org/v3#Constraint",
                    "predicates": [
                        "sbol:Constraint"
                    ],
                    "link": "$<constraintLink>"
                },
                {
                    "title": "constraintLink",
                    "hide": true,
                    "predicates": []
                }
            ]
        },
        {
            "title": "Interfaces",
            "rootPredicate": "sbol:hasInterface",
            "icon": "faStickyNote",
            "sections": [
                {
                    "title": "Interface",
                    "infoLink": "https://sbols.org/v3#Interface",
                    "predicates": [

                    ],
                    "link": "$<interfaceLink>"
                },
                {
                    "title": "interfaceLink",
                    "hide": true,
                    "predicates": []
                }
            ]
        },
        {
            "title": "Models",
            "rootPredicate": "sbol:hasModel",
            "icon": "faBuilding",
            "sections": [
                {
                    "title": "Model",
                    "infoLink": "https://sbols.org/v3#Model",
                    "predicates": [

                    ],
                    "link": "$<modelLink>"
                },
                {
                    "title": "modelLink",
                    "hide": true,
                    "predicates": []
                }
            ]
        }
    ],
    "pages": [
        "Details",
        "$TABLES[Sequences]",
        "$TABLES[Features]",
        "$TABLES[Interactions]",
        "$TABLES[Sequence Constraints]",
        "$TABLES[Interfaces]",
        "$TABLES[Models]",
        "Other Properties",
        "Member of these Collections",
        "Attachments"
    ]
}


test('Validates JSON structure and key fields', () => {
    // Check if the root type is correct
    expect(jsonData.type).toBe('http://sbols.org/v3#Component');

    // Check prefixes array
    expect(jsonData.prefixes).toHaveLength(9);
    expect(jsonData.prefixes[0]).toBe('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>');

    // Check metadata
    expect(jsonData.metadata).toHaveLength(2);
    expect(jsonData.metadata[0].title).toBe('Type');
    expect(jsonData.metadata[0].rootPredicate).toBe('sbol:type');
    expect(jsonData.metadata[1].icon).toBe('faUserTag');

    // Check tables
    expect(jsonData.tables).toHaveLength(6);

    const expectedTableTitles = [
        'Sequences',
        'Features',
        'Interactions',
        'Sequence Constraints',
        'Interfaces',
        'Models'
    ];
    
    jsonData.tables.forEach((table, index) => {
        expect(table.title).toBe(expectedTableTitles[index]);
    });

    expect(jsonData.tables[0].rootPredicate).toBe('sbol:hasSequence');
    expect(jsonData.tables[1].icon).toBe('faThLarge');

    // Check pages array
    expect(jsonData.pages).toHaveLength(11);
    expect(jsonData.pages[0]).toBe('Details');
    expect(jsonData.pages[1]).toBe('$TABLES[Sequences]');
    expect(jsonData.pages[5]).toBe('$TABLES[Interfaces]');
});