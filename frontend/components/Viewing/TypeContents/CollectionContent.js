import Members from "../Collection/Members";
import Section from "../Sections/Section";
import Details from "../Sections/Details";

export function CollectionContent(properties) {
   return (
      <div>
         <Members uri={properties.uri} />
         <Section title="Details">
            <Details uri={properties.uri} />
         </Section>
      </div>
   )
}

export const collectionPages = ["Members", "Details", "Other Properties", "Attachments"];