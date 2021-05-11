import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSearchQuery } from "../../redux/actions";

import { searchbar, searchexpand } from '../../styles/navbar.module.css';

export default function SearchBar() {
   // expand is for animating the search bar expanding when it is opened
   const [expand, setExpand] = useState("");
   const query = useSelector(state => state.search.query);
   const dispatch = useDispatch();

   useEffect(() => {
      setExpand(searchexpand);
   });
   return (
      <input 
      onChange={e => dispatch(setSearchQuery(e.target.value))}
      value={query}
      className={searchbar + ' ' + expand} 
      type="text" 
      placeholder="Search SynBioHub" 
      autoFocus 
      />
   );
}