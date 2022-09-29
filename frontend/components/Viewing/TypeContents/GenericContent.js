import Section from '../Sections/Section';
import Details from '../Sections/Details/Details.js';
import OtherProperties from '../Sections/OtherProperties';
import MemberOfCollections from '../Sections/MemberOfCollections';
import Attachments from '../Sections//Attachments/Attachments';
import GenericTable from '../TypeContents/GenericTable';
import Members from '../../Viewing/Collection/Members';

import { useSelector } from 'react-redux';
import { Fragment } from 'react';

export default function GenericContent(properties) {
  const pageSectionsOrder = useSelector(state => state.pageSections.order);
  const sectionsOrder = generateSectionOrder(pageSectionsOrder, properties);

  return <Fragment>{sectionsOrder}</Fragment>;
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

/**
 * Returns the corresponding section component.
 *
 * @param {String} sectionName The name of the section.
 * @param {Any} properties The properties that can be accessed by the section.
 */
function getSection(sectionName, properties) {
  switch (sectionName) {
    case 'Details':
      return (
        <Section title={sectionName}>
          <Details uri={properties.uri} />
        </Section>
      );
    case 'Components':
      return (
        <Section title={sectionName}>
          <GenericTable
            title={sectionName}
            type={properties.type}
            uri={properties.uri}
          />
        </Section>
      );
    case 'Sequence Annotations':
      return (
        <Section title={sectionName}>
          <GenericTable
            title={sectionName}
            type={properties.type}
            uri={properties.uri}
          />
        </Section>
      );
    case 'Other Properties':
      return (
        <Section title={sectionName}>
          <OtherProperties uri={properties.uri} />
        </Section>
      );
    case 'Member of these Collections':
      return (
        <Section title={sectionName}>
          <MemberOfCollections uri={properties.uri} />
        </Section>
      );
    case 'Attachments':
      return (
        <Section title={sectionName}>
          <Attachments
            uri={properties.uri}
            setRefreshMembers={properties.setRefreshMembers}
          />
        </Section>
      );
    case 'Members':
      return (
        <Section title={sectionName}>
          <Members
            uri={properties.uri}
            refreshMembers={properties.refreshMembers}
            setRefreshMembers={properties.setRefreshMembers}
          />
        </Section>
      );
    default:
      return <Section title={sectionName}></Section>;
  }
}
