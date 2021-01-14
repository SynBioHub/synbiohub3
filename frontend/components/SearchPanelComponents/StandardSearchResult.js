import { useEffect, useState } from 'react';
import { standardresult, standardresultname, standardresultdisplayid, standardresultdesc, standardresulttype } from '../../styles/searchpanel.module.css';

export default function StandardSearchResult(props) {
   const [type, setType] = useState("");
   useEffect(() => {
      var potential_type = props.result.type.toLowerCase();
      if (potential_type.includes("component"))
         setType("Component");
      if (potential_type.includes("sequence"))
         setType("Sequence");
      if (potential_type.includes("module"))
         setType("Module");
      if (potential_type.includes("collection"))
         setType("Collection");
   }, [props.result.type])
   return (
      <div className={standardresult}>
         <p className={standardresultname}>{props.result.name}</p>
         <p className={standardresulttype}>{type ? type + ", " : ""} Version {props.result.version}</p>
         <p className={standardresultdisplayid}>{props.result.displayId}</p>
         <p className={standardresultdesc}>{props.result.description}</p>
      </div>
   );
}