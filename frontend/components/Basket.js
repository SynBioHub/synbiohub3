import Image from 'next/image'
import { useState } from 'react';
import styles from '../styles/basket.module.css'

export default function Basket(props) {
   const [showBasket, setShowBasket] = useState(false);
   //console.log(props.basketItems);
   if (!showBasket)
   {
      return (
         <div className={styles.basketcontainer} onClick={() => setShowBasket(true)}>
            <Image 
            src='/images/basket.svg'
            alt='view basket'
            width={40}
            height={40}/>
         </div>
      );
   }
   const items = props.basketItems.map(item => {
      return <span className={styles.item} key={item.displayId}>{item.name}</span>
   })
   return (
      <div>
         <div className={styles.basketcontent}>
            <div className={styles.heading}>
               <div className={styles.basketlabel}>My Basket</div>
               <div className={styles.addfolder}>
                  <Image
                  src='/images/newfolder.svg'
                  alt='new folder'
                  width={20}
                  height={20}
                  />
                  <span className={styles.addfoldertitle}>Create Collection</span>
               </div>
            </div>
            <div className={styles.itemscontainer}>
               {items}
            </div>
         </div>
         <div className={styles.basketcontainer} onClick={() => setShowBasket(false)}>
            <Image 
            src='/images/close.svg'
            alt='view basket'
            width={40}
            height={40}/>
         </div>
      </div>
   )
}