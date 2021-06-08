import SearchPanel from '../../components/SearchPanel';
import TopLevel from '../../components/TopLevel';

export default function StandardSearch() {
  return (
    <TopLevel searchMode={true}>
      <SearchPanel />
    </TopLevel>
  );
}
