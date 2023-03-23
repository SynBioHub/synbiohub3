import { useState } from 'react';
import MetadataInfo from '../../MetadataInfo';
import RowWrapper from './RowWrapper';

export default function MetadataRenderer({ title, content }) {
  if (!content) return null;
  const [sectionIcon, setSectionIcon] = useState(null);
  const contentConsolidated = content.map((row, index) => {
    return (
      <RowWrapper
        sections={row}
        metadata={true}
        setSectionIcon={setSectionIcon}
        key={index}
      />
    );
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
