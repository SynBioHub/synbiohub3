

import { useEffect, useState } from 'react'
import styles from '../styles/searchpanel.module.css'
import SearchTypeSelector from './SearchPanelComponents/SearchTypeSelector';
import StandardSearch from './SearchPanelComponents/StandardSearch';
import Basket from './Basket';

export default function SearchPanel(props) {
   const [show, setShow] = useState("");
   const [selectedType, setSelectedType] = useState("Standard Search");
   const [basketItems, setBasketItems] = useState([]);
   useEffect(() => {
      setShow(styles.show);
   });
   var searchResults = null;
   switch(selectedType) {
      case "Standard Search":
         searchResults = <StandardSearch query={props.query} basketItems={basketItems} setBasketItems={setBasketItems}/>
   }
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
   )
}