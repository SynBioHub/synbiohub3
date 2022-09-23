import Section from "../Sections/Section";
import Details from "../Sections/Details/Details.js";
import OtherProperties from "../Sections/OtherProperties";
import MemberOfCollections from "../Sections/MemberOfCollections";
import Attachments from "../Sections//Attachments/Attachments";

import { componentPages, getComponentComponents } from "./Component";

import { useSelector } from 'react-redux';
import React from "react";


export function GenericContent(properties) {
    const pageSectionsOrder = useSelector(state => state.pageSections.order);
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
    const components = getComponents(properties.uri);

    for(let i = 0; i < pages.length; i++) {
        if(sectionName === sections[i]) {
            return (
                <Section title = {sectionName}>
                    {components[i]}
                </Section>
            )
        }
    }

    return (
        <Section title = {sectionName}>

        </Section>
    )
    // switch (sectionName) {
    //     case componentPages[0]:
    //         return (
    //             <Section title={sectionName}>
    //                 {components[0]}
    //             </Section>
    //         );
    //     case componentPages[3]:
    //         return (
    //             <Section title={sectionName}>
    //                 <OtherProperties uri={properties.uri} />
    //             </Section>
    //         );
    //     case componentPages[4]:
    //         return (
    //             <Section title={sectionName}>
    //                 <MemberOfCollections uri={properties.uri} />
    //             </Section>
    //         );
    //     case componentPages[5]:
    //         return (
    //             <Section title={sectionName}>
    //                 <Attachments uri={properties.uri} />
    //             </Section>
    //         )
    //     default:
    //         return (
    //             <Section title={sectionName}>

    //             </Section>
    //         );
    // }
}

export const sections = componentPages;