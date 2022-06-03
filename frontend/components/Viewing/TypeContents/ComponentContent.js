import Section from "../Sections/Section";
import Details from "../Sections/Details";
import OtherProperties from "../Sections/OtherProperties";

import { useSelector } from 'react-redux';
import React from "react";
import MemberOfCollections from "../Sections/MemberOfCollections";

/**
 * Generates the content for the component.
 * 
 * @param {Any} properties Information passed down from the parent.
 * @returns The page sections that are in correct order.
 */
export function ComponentContent(properties) {
   const pageSectionsOrder = useSelector(state => state.pageSections.sectionOrder.order);
   const sectionsOrder = generateSectionOrder(pageSectionsOrder, properties);

   return (
      <React.Fragment>
         {sectionsOrder}
      </React.Fragment>
   );
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
      return (
         <React.Fragment key={index}>
            {getSection(page, properties)}
         </React.Fragment>
      );
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
      case "Details":
         return (
            <Section title={sectionName}>
               <Details uri={properties.uri} />
            </Section>
         );
      case "Other Properties":
         return (
            <Section title={sectionName}>
               <OtherProperties uri={properties.uri} />
            </Section>
         );
      case "Member of these Collections":
         return (
            <Section title={sectionName}>
               <MemberOfCollections uri={properties.uri} />
            </Section>
         );
      default:
         return (
            <Section title={sectionName}>

            </Section>
         );
   }
}

export const componentPages = ["Details", "Components", "Sequence Annotations", "Other Properties",
   "Member of these Collections", "Attachments"];