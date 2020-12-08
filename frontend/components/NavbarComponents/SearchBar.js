import { useEffect, useState } from "react";

import { searchbar, searchexpand } from '../../styles/navbar.module.css';

export default function SearchBar(props) {
   const [expand, setExpand] = useState("");
   useEffect(() => {
      setExpand(searchexpand);
   });
   return (
      <input 
      onChange={e => props.setQuery(e.target.value)}
      value={props.query}
      className={searchbar + ' ' + expand} 
      type="text" 
      placeholder="Search SynBioHub" 
      autoFocus 
      />
   );
}