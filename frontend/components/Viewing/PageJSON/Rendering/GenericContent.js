import Section from '../../Sections/Section';

import { useSelector } from 'react-redux';
import { Fragment } from 'react';
import TableBuilder from './TableBuilder';

import CustomComponents from '../CustomComponents.js';

export default function GenericContent({ json, uri, metadata }) {
  if (metadata) {
    if (!json || !json.metadata) return null;
    const content = json.metadata.map((metadata, index) => {
      return (
        <TableBuilder
          uri={uri}
          prefixes={json.prefixes}
          table={metadata}
          metadata={true}
          key={index}
        />
      );
    });

    return <Fragment>{content}</Fragment>;
  }

  const pages = useSelector(state => state.pageSections.order);

  const content = pages.map((page, index) => {
    if (page.startsWith('$TABLES[')) {
      const title = page.substring(8, page.length - 1);
      const table = json.tables.find(table => table.title === title);
      return (
        <Section id={page} title={table.title} key={index}>
          <TableBuilder uri={uri} prefixes={json.prefixes} table={table} />
        </Section>
      );
    }
    const ComponentToRender = CustomComponents[page];
    return (
      <Section title={page} key={index}>
        <ComponentToRender uri={uri} />
      </Section>
    );
  });

  return <Fragment>{content}</Fragment>;
}

// This is Alex's code for the previous table renderer. I'm keeping it
// for now to keep track of custom components, but this is dead code/not valid
// and if you delete it it's totally fine (zombie code sucks)

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
