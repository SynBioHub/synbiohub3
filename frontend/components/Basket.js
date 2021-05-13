import Image from 'next/image';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import styles from '../styles/basket.module.css';

/**
 * This component represents the basket in the search page. It stores the uri/name/displayId of 
 * search results users would like to store for later (whether that be to create a collection, for
 * future reference, or for downloading)
 */
export default function Basket() {
  const [
    showBasket,
    setShowBasket,
  ] = useState(false);
  const basketItems = useSelector((state) => state.basket.basket);

  if (!showBasket) {
    return (
      <div
        className={styles.basketcontainer}
        onClick={() => setShowBasket(true)}
      >
        <Image
          alt="view basket"
          height={40}
          src="/images/basket.svg"
          width={40}
        />
      </div>
    );
  }
  const items = basketItems.map((item) => (
    <span
      className={styles.item}
      key={item.uri}
    >
      {item.name}
    </span>
  ));

  return (
    <div>
      <div className={styles.basketcontent}>
        <div className={styles.heading}>
          <div className={styles.basketlabel}>My Basket</div>

          <div className={styles.addfolder}>
            <Image
              alt="new folder"
              height={20}
              src="/images/newfolder.svg"
              width={20}
            />

            <span className={styles.addfoldertitle}>Create Collection</span>
          </div>
        </div>

        <div className={styles.itemscontainer}>
          {items}
        </div>
      </div>

      <div
        className={styles.basketcontainer}
        onClick={() => setShowBasket(false)}
      >
        <Image
          alt="view basket"
          height={40}
          src="/images/close.svg"
          width={40}
        />
      </div>
    </div>
  );
}
