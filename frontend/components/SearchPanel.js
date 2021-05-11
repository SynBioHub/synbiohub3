

import { useEffect, useState } from 'react'
import styles from '../styles/searchpanel.module.css'
import SearchTypeSelector from './SearchPanelComponents/SearchTypeSelector';
import StandardSearch from './SearchPanelComponents/StandardSearch';
import Basket from './Basket';
import { useSelector } from 'react-redux';

export default function SearchPanel(props) {
   const showSearchPanel = useSelector(state => state.search.active);
   const [show, setShow] = useState("");
   const [selectedType, setSelectedType] = useState("Standard Search");
   const [basketItems, setBasketItems] = useState([]);
   useEffect(() => {
      setShow(styles.show);
   });
   var searchResults = null;
   switch(selectedType) {
      case "Standard Search":
         searchResults = <StandardSearch basketItems={basketItems} setBasketItems={setBasketItems}/>
   }
   if (showSearchPanel) {
      return (
         <div className={styles.container + ' ' + show}>
            <div className={styles.categories}>
               <SearchTypeSelector name="Standard Search" selectedType={selectedType} setSelectedType={setSelectedType}/>
               <SearchTypeSelector name="Sequence Search" selectedType={selectedType} setSelectedType={setSelectedType}/>
               <SearchTypeSelector name="Advanced Search" selectedType={selectedType} setSelectedType={setSelectedType}/>
               <SearchTypeSelector name="SPARQL" selectedType={selectedType} setSelectedType={setSelectedType}/>
            </div>
            {searchResults}
            <Basket basketItems={basketItems} />
         </div>
      );
   }
   else
      return null;
}