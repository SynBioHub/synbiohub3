import { UnControlled as CodeMirror } from 'react-codemirror2';

const CodeFormat = ({ query, setQuery }) => {
  return (
    <CodeMirror
      onChange={(editor, data, value) => {
        setQuery(value);
      }}
      value={query}
      width="10px"
      options={{
        mode: 'sparql',
        lineNumbers: true,
        viewportMargin: Number.POSITIVE_INFINITY
      }}
    />
  );
};

export default CodeFormat;
