import { navoption, navoptionicon, navoptionname } from '../../styles/navbar.module.css'

export default function Selector(props) {
  return (
    <div className={navoption}>
      <img
        className={navoptionicon}
        src={props.icon}
      />

      <span className={navoptionname}>{props.name}</span>
    </div>
  )
}
