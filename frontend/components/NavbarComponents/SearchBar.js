import { useEffect, useState } from "react";

import { searchbar, searchexpand } from '../../styles/navbar.module.css';

export default function SearchBar() {
   const [expand, setExpand] = useState("");
   useEffect(() => {
      setExpand(searchexpand);
   });
   return (
      <input className={searchbar + ' ' + expand} type="text" placeholder="Search SynBioHub" autoFocus />
   );
}