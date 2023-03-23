import MetadataInfo from '../../MetadataInfo';
import RowWrapper from './RowWrapper';

export default function MetadataRenderer({ title, content2 }) {
  if (!content2) return null;
  let sectionIcon = null;
  const contentConsolidated = content2.map((row, index) => {
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
