import Details from "../Sections/Details/Details.js";
import OtherProperties from "../Sections/OtherProperties";
import MemberOfCollections from "../Sections/MemberOfCollections";
import Attachments from "../Sections//Attachments/Attachments";

export const componentPages =
    ["Details", "Components", "Sequence Annotations", "Other Properties",
        "Member of these Collections", "Attachments"];

export function getComponentComponents(properties) {
    return [
        <Details uri={properties.uri} />,
        <OtherProperties uri={properties.uri} />,
        <MemberOfCollections uri={properties.uri} />,
        <Attachments uri={properties.uri} />
    ];
}