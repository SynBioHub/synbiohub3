import Members from "../Collection/Members";
import Section from "../Sections/Section";
import Details from "../Sections/Details";

import { useSelector } from 'react-redux';
import React from "react";

export function CollectionContent(properties) {
   const pageSectionsOrder = useSelector(state => state.pageSections.order);
   const sectionsOrder = generateSectionOrder(pageSectionsOrder, properties.uri);

   return (
      <React.Fragment>
         {sectionsOrder}
      </React.Fragment>
   )
}

function generateSectionOrder(pages, uri) {
   const sections = pages.map((page, index) => {
      return (
         <React.Fragment key={index}>
            {getSection(page, uri)}
         </React.Fragment>
      );
   });

   return sections;
}

function getSection(sectionName, uri) {
   switch (sectionName) {
      case "Members":
         return <Members uri={uri} />
      case "Details":
         return (
            <Section title={sectionName}>
               <Details uri={uri} />
            </Section>
         );
      default:
         return (
            <Section title={sectionName}>

            </Section>
         );
   }
}

export const collectionPages = ["Members", "Details", "Other Properties", "Attachments"];