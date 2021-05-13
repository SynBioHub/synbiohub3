

import { useEffect, useState } from 'react'
import styles from '../styles/searchpanel.module.css'
import SearchTypeSelector from './SearchPanelComponents/SearchTypeSelector'
import StandardSearch from './SearchPanelComponents/StandardSearch/StandardSearch'
import Basket from './Basket'
import { useSelector } from 'react-redux'

export default function SearchPanel() {
  const showSearchPanel = useSelector((state) => state.search.active)
  const [
    show,
    setShow
  ] = useState('')
  const [
    selectedType,
    setSelectedType
  ] = useState('Standard Search')

  useEffect(() => {
    setShow(styles.show)
  })
  let searchResults = null

  switch (selectedType) {
  case 'Standard Search':
    searchResults = <StandardSearch />
  }
  if (showSearchPanel) {
    return (
      <div className={`${styles.container} ${show}`}>
        <div className={styles.categories}>
          <SearchTypeSelector
            name="Standard Search"
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />

          <SearchTypeSelector
            name="Sequence Search"
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />

          <SearchTypeSelector
            name="Advanced Search"
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />

          <SearchTypeSelector
            name="SPARQL"
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />
        </div>

        {searchResults}

        <Basket />
      </div>
    )
  }

  return null
}
