import IconsMap from '../IconsMap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from '../../../../styles/view.module.css';

export default function RenderIcon({
  icon,
  color = '#465875',
  size = '1x',
  style = styles.searchicon
}) {
  if (IconsMap[icon]) {
    return (
      <FontAwesomeIcon
        icon={IconsMap[icon]}
        size={size}
        color={color}
        className={style}
      />
    );
  }
  return null;
}
