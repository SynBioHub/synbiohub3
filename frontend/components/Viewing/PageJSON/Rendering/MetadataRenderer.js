import MetadataInfo from '../../MetadataInfo';
import RowWrapper from './RowWrapper';

export default function MetadataRenderer({ title, content }) {
  if (!content) return null;
  let sectionIcon = null;
  const contentConsolidated = content.map((row, index) => {
    return <RowWrapper sections={row} key={index} />;
  });
  return (
    <MetadataInfo
      icon={sectionIcon}
      label={title}
      title={contentConsolidated}
      specific={true}
    />
  );
}
