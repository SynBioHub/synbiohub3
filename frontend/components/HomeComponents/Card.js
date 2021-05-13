import { useDispatch } from 'react-redux'
import { setSearchingActive } from '../../redux/actions'
import { card, cardhead, cardicon } from '../../styles/home.module.css'

export default function Card(props) {
  const dispatch = useDispatch()
  const title = props.icon
    ? (<div className={cardhead}>
  <h3>{props.title}</h3>

      <img
           style={props.iconheight
          ? { height: props.iconheight,
            verticalAlign: props.iconoffset,
            marginLeft: props.iconright }
          : {}}
           src={props.icon}
           className={cardicon}
         />
</div>)
    : <h3>{props.title} <span style={{ color: 'black' }}>&rarr;</span></h3>

  return (
    <a
      className={card}
      onClick={() => {
        if (props.title === 'Search') {
          dispatch(setSearchingActive(true))
        }
      }}
    >
      {title}

      <p>{props.description}</p>
    </a>
  )
}
