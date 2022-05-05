import Section from "../Sections/Section";
import Details from "../Sections/Details";

export function ComponentContent(properties) {
   return (
      <div>
         <Section title="Details">
            <Details uri={properties.uri} />
         </Section>
      </div>
   )
}

export const componentPages = ["Details", "Components", "Sequence Annotations", "Other Properties", 
"Member of these Collections", "Attachments"];