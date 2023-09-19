## Introduction

SynBioHub3 provides contributors the ability to define the general format of the viewing interface for differing SBOL types (and versions). This is accomplished through processing of custom JSON pages that contributors define. The purpose of this document is to give SynBioHub contributors a brief introduction to creating, modifying, and understanding these custom JSON pages.

## Overview of Architecture

There are a few files/directories that SynBioHub contributors must be aware of in order to dictate the structure of viewing interfaces. All of these files/directories are in the `components/Viewing/PageJSON` [directory](components/Viewing/PageJSON).

1. The [Types](components/Viewing/PageJSON/Types) directory (found at `components/Viewing/PageJSON/Types`) is where all the custom JSON files are stored that contributors create.

2. The [MasterJSON.js](components/Viewing/PageJSON/MasterJSON.js) file is where all of the JSON files are exported to be used by the interface rendering code. This file maps SBOL types (such as `http://sbols.org/v2#ComponentDefinition`, for example) to the corresponding JSON file used to render that type.

3. The [IconsMap.js](components/Viewing/PageJSON/IconsMap.js) file is where React Font Awesome icons are mapped to IDs, or 'keys' that can then be referenced in the custom JSON files to indicate icons for tables, metadata, and page sections.

4. The [CustomComponents.js](components/Viewing/PageJSON/CustomComponents.js) file allows contributors to create and export custom components for the viewing interface that can be referenced (or basically imported) by the custom JSON files.

## Custom JSON format

**Important Note: Please reference [ComponentDefinition.json](components/Viewing/PageJSON/Types/ComponentDefinition.json) to better understand the structure of the custom JSON files.**

### Overview

The JSON files allow SynBioHub contributors to define (for a specific SBOL data type) what sections will be on a viewing interface, what sort of additional metadata will be displayed for that type, and (last but not least) custom (simple) tables to reflect that SBOL type (for example, sequence annotations for a component definition). This section will explain the required structure to accomplish these tasks, as well as the JSON properties they can use.

### Structure

A custom JSON file has four main sections:

1. `prefixes` - This is an array of prefixes (strings) used in the [SPARQL](https://en.wikibooks.org/wiki/SPARQL/Prefixes) queries for fetching metadata and data for custom tables. See the [ComponentDefinition.json](components/Viewing/PageJSON/Types/ComponentDefinition.json) file for an example.

2. `tables` - An array of JSON objects that define custom tables to be displayed for a particular SBOL type (such as Sequence Annotations for Component Definitions)

3. `metadata` - An array of JSON objects that define additional metadata to be displayed for the particular SBOL type

4. `pages` - An array of strings that define which sections will be included on a particular SBOL type's viewing page.

### Defining Tables

To define a custom table for a SBOL type's viewing page, start by adding a new JSON object to the `tables` array. This object will have 4 required properties:

1. `icon` - a string, which is the ID of the icon to be associated with the table in the viewing interface (see "Referencing Icons" in the "Additional Instructions" section below)

2. `title` - a string, which will be the displayed title of the custom table, e.g. "Sequence Annotations"

3. `rootPredicate` - a string indicating the "root" SBOL property from which the table will be fetching information. (In the Sequence Annotations table, this would be "sbol:sequenceAnnotation")

4. `sections` - an array of JSON objects that define the sections, or columns, of the custom table

5. `orderBy` - an optional property that allows the table rows to be ordered in a custom way (it's essentially an additional ORDER BY statement added to the SPARQL query that occurs under the hood)

#### Defining Table Sections (columns)

A section is defined by a JSON object with various properties. These properties are listed below:

1. `title` - a string indicating the displayed label of the section/table column (such as "Privacy", or "Name", etc.). This is also treated as the ID of the section, which allows other sections within the table to reference this section (see "Referencing Other Sections Within a Section" in "Additional Instructions" below)

2. `predicates` - an array of strings representing where to find the piece of information the section is attempting to display/represent, starting at the `rootPredicate` and then tunneling down through the predicates array from left to right. This can be an empty array if no further queries digging needs to be made beyond the rootPredicate

3. `icon` - a string, which is the ID of the icon to be associated with the section (columns) header (see `title` property above) (see "Referencing Icons" in the "Additional Instructions" section below for information about referencing icons by ID)

4. `link` - a string, which is the link that the user of SynBioHub will be navigated to upon clicking on the displayed section. This link can reference values other sections (see "Referencing Other Sections Within a Section" in "Additional Instructions" below)

5. `linkType` - a string, indicating the type of link the section/column represents. For example, a search link might be rendered differently (with a search icon next to it). Current supported linkTypes are 'search' and 'default'. If you omit this property, the link type will automatically be considered as 'default'

6. `text` - a string representing the (text) value of the section. By default, this will just be the result of the data fetched for that section. However, if you want to add additional text/custom text for the section, you can add a `text` field with a corresponding string value (this is where referencing other section's values come in handy, see "Referencing Icons" in the "Additional Instructions" section below)

7. `infoLink` - a string representing the link a user will be navigated to when clicking on the section/columns corresponding icon

8. `hide` - a boolean indicating whether the section should be displayed in the table (sometimes, a section is hidden because it is only used as a reference (for example, to define a link property for another displayed section))

9. `group` - a boolean indicating whether to group data that has more than one result in 1 section/row, rather than in multiple separate sections/rows of the table

**Important Note: Some (in fact a majority) of these properties are optional, one can leave them out of the JSON object if they choose to do so. Optional properties include icon, text, infoLink, hide, group, and link. Predicates can be omitted if there is a text property filled in. EVERY SECTION MUST HAVE A UNIQUE TITLE**

### Defining Additional Metadata

Defining additional metadata is very similar to defining custom tables (by design, as it makes both of these processes easier to learn). To define additional metadata to be displayed for an SBOL type, start by adding a new JSON object to the `metadata` array. This object will have 4 required properties:

1. `icon` - a string, which is the ID of the icon to be associated with the corresponding metadata in the viewing interface (see "Referencing Icons" in the "Additional Instructions" section below)

2. `title` - a string, which will be the displayed label/header of the custom metadata

3. `rootPredicate` - a string indicating the "root" SBOL property from which the data fetching will begin

4. `sections` - an array of JSON objects that define the sections, or metadata sections, to be displayed

#### Defining Metadata Sections

A section is defined by a JSON object with various properties. These properties are essentially identical to the properties listed in "Defining Table Sections" above. The only thing to be wary of is these sections will be rendered differently. Rather than being rendered as a table, these sections will be rendered as individual sections (rows) of displayed metadata in the viewing interface's side panel.

**Important Note: For metadata, some of the properties in a table's section object aren't necessary/do nothing. These properties include icon and infoLink.**

### Defining Pages

The custom JSON allows us to define which sections will be included (as well as their default order) on the page for the specific SBOL type. This is done by modifying the `pages` property of the JSON (which is an array of strings). Each string element in the array represents a page section.

There are two types of page "sections" one can refer to. To define a page section that is rendered using a custom component, simply write the string as the ID of the custom component exported from the [CustomComponents.js](components/Viewing/PageJSON/CustomComponents.js) file. To define a page section that maps to a custom table defined in the JSON `tables` array, simply write the string as `$TABLES[<Title of Custom Table>]`.

If this is confusing, I recommend looking at the `pages` section in the [ComponentDefinition.json](components/Viewing/PageJSON/Types/ComponentDefinition.json) file.

## Additional Instructions

### Referencing Icons

Because icons in SynBioHub are React components, they must be imported/exported at some point in order for the custom JSON pages to reference specific icons (in the page's `icon` fields, which reference Font Awesome icons by ID). This importing/exporting is done in [IconsMap.js](components/Viewing/PageJSON/IconsMap.js). It exports a JSON object with IDs mapping to corresponding icons. Once an icon mapping is added to this file, JSON pages can then reference these icons by their IDs (make sure everything matches up).

### Referencing Other Sections Within a Section

Oftentimes, table and metadata sections will have to reference multiple SBOL properties in rendering. For example, a table section (column) might display the result of some SBOL property (for example, dcterms:title), but use a completely different SBOL property for its corresponding link (say sbol:sequenceAnnotation). For this reason, functionality has been added which allows both `link` and `text` properties of the custom JSON pages to dynamically reference the values of other sections.

Doing this is quite simple. To reference the value of a section within another section, simply include `$<OTHER SECTION TITLE>` in the section's `title` or `link` properties. For example, say I have a section with title `displayText`. I want it to link to the section with title `specialLink`. I can simply set the "displayText" section's `link` property to: `"$<specialLink>"`.

Say I want the link to still include `specialLink`'s value, but I want the link to be prepended with "synbiohub.org/". No problem! We can simply change the "displayText" section's `link` property to: `"synbiohub.org/$<specialLink>"`.

## Process for Adding Custom JSON Page

1. Ensure all icons you'd like to use are in the [IconsMap.js](components/Viewing/PageJSON/IconsMap.js) file
2. Ensure any custom components you'd like to use are in the [CustomComponents.js](components/Viewing/PageJSON/CustomComponents.js) file
3. Add JSON file to the [Types](components/Viewing/PageJSON/Types) directory
4. Fill out JSON, look at other JSON files for examples (see "Custom JSON format" section above)
5. Import JSON file into [MasterJSON.js](components/Viewing/PageJSON/MasterJSON.js) file. **Make sure the exported object from MasterJSON.js is as follows: `<SBOL TYPE URL>: <IMPORTED JSON PAGE OBJECT>`**
6. Ensure the page is rendered correctly, fix bugs and continue development as appropriate.
