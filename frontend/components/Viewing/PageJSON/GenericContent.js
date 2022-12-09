import Section from '../Sections/Section';
import Details from '../Sections/Details/Details.js';
import OtherProperties from '../Sections/OtherProperties';
import MemberOfCollections from '../Sections/MemberOfCollections';
import Attachments from '../Sections/Attachments/Attachments';
import Members from '../Collection/Members';

import { useSelector } from 'react-redux';
import { Fragment } from 'react';
import TableBuilder from './TableBuilder';

import MasterJSON from './Master.js';
import CustomComponents from './CustomComponents.js';

export default function GenericContent(properties) {
  if (properties.type) {
    const json = MasterJSON[properties.type];
    const pages = json.pages;

    // <CustomComponents.Details uri={properties.uri} />

    const content = pages.map((page, index) => {
      if (page.startsWith('$TABLES[')) {
        const title = page.substring(8, page.length - 1);
        const table = json.tables.find(table => table.title === title);
        return (
          <Section title={table.title} key={index}>
            <TableBuilder
              uri={properties.uri}
              prefixes={json.prefixes}
              table={table}
            />
          </Section>
        );
      }
      console.log(page);
      const ComponentToRender = CustomComponents[page];
      return (
        <Section title={page} key={index}>
          <ComponentToRender uri={properties.uri} />
        </Section>
      );
    });

    // const pageSectionsOrder = useSelector(state => state.pageSections.order);
    //const sectionsOrder = generateSectionOrder(pageSectionsOrder, properties);

    return <Fragment>{content}</Fragment>;
  }
  return null;
}

/**
 * Maps the page section names and returns the corresponding page section components.
 *
 * @param {Array} pages An array containing the current order of the page sections.
 * @param {Any} properties Component properties passed into page sections.
 * @returns The different page sections.
 */
function generateSectionOrder(pages, properties) {
  return pages.map((page, index) => {
    return <Fragment key={index}>{getSection(page, properties)}</Fragment>;
  });
}

// /**
//  * Returns the corresponding section component.
//  *
//  * @param {String} sectionName The name of the section.
//  * @param {Any} properties The properties that can be accessed by the section.
//  */
// function getSection(sectionName, properties) {
//   switch (sectionName) {
//     case 'Details':
//       return (
//         <Section title={sectionName}>
//           <Details uri={properties.uri} />
//         </Section>
//       );
//     case 'Components':
//       return (
//         <Section title={sectionName}>
//           <TableBuilder uri={properties.uri} type={properties.type} index={1} />
//         </Section>
//       );
//     case 'Sequence Annotations':
//       return (
//         <Section title={sectionName}>
//           <TableBuilder uri={properties.uri} type={properties.type} index={0} />
//         </Section>
//       );
//     case 'Other Properties':
//       return (
//         <Section title={sectionName}>
//           <OtherProperties uri={properties.uri} />
//         </Section>
//       );
//     case 'Member of these Collections':
//       return (
//         <Section title={sectionName}>
//           <MemberOfCollections uri={properties.uri} />
//         </Section>
//       );
//     case 'Attachments':
//       return (
//         <Section title={sectionName}>
//           <Attachments
//             uri={properties.uri}
//             setRefreshMembers={properties.setRefreshMembers}
//           />
//         </Section>
//       );
//     case 'Members':
//       return (
//         <Section title={sectionName}>
//           <Members
//             uri={properties.uri}
//             refreshMembers={properties.refreshMembers}
//             setRefreshMembers={properties.setRefreshMembers}
//           />
//         </Section>
//       );
//     default:
//       return <Section title={sectionName}></Section>;
//   }
// }
