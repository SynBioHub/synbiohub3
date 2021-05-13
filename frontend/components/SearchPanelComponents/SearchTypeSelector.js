import { categoryheader, categoryname, categoryselected } from '../../styles/searchpanel.module.css';

export default function SearchTypeSelector(props) {
  const extraClass = props.selectedType === props.name
    ? categoryselected
    : '';

  return (
    <div
      className={categoryheader}
      onClick={() => props.setSelectedType(props.name)}
    >
      <p className={`${categoryname} ${extraClass}`}>{props.name}</p>
    </div>
  );
}
