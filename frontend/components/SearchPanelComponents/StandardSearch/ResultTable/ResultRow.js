import { useEffect, useState } from "react";

export default function ResultRow(props) {
   var type = "";
   const potential_type = props.type.toLowerCase();
   if (potential_type.includes("component"))
      type = "Component";
   if (potential_type.includes("sequence"))
      type = "Sequence";
   if (potential_type.includes("module"))
      type = "Module";
   if (potential_type.includes("collection"))
      type = "Collection";
   return (
      <tr>
         <td>
            <input type="checkbox" checked={props.selected.get(props.displayId)} 
            onChange={(e) => props.setSelected(new Map(props.selected.set(props.displayId, e.target.checked)))} />
         </td>
         <td>{props.name}</td>
         <td>{props.displayId}</td>
         <td>{props.description}</td>
         <td>{type}</td>
         <td>{props.version}</td>
      </tr>
   );
}