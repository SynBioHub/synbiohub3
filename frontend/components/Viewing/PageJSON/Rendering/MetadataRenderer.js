import MetadataInfo from '../../MetadataInfo';
import SectionRenderer from './SectionRenderer';

export default function MetadataRenderer({ title, content }) {
  if (!content) return null;
  let sectionIcon = null;
  const contentConsolidated = content.map(metadata => {
    return metadata
      .filter(section => !section.hide)
      .map((section, index) => {
        if (!section.text) {
          section.text = 'No data';
        }
        if (section.tableIcon) sectionIcon = section.tableIcon;
        return (
          <div key={title + index + section.text}>
            <SectionRenderer column={section} metadata={true} />
          </div>
        );
      });
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
