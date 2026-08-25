// Terms per SBOL 2.3.0 spec: types/roles in Section 7.7 (Tables 2 & 4),
// TopLevel classes in Section 7.5, Collection in Section 7.10.
const facetDefinitions = {
  'Part Type':
    'The molecular category of the part: DNA, RNA, Protein, Complex, or Small Molecule.',
  'Part Role':
    'The biological function the part performs, e.g. Promoter, RBS, CDS, Terminator, or Gene.',
  'Object Type':
    'The kind of SBOL record itself, e.g. ComponentDefinition, ModuleDefinition, Collection, Sequence, or Model.',
  Collections:
    'Named groups of related parts, such as a project or curated set, the part belongs to.',
  Creator: 'The person or organization credited as the author of this record.'
};

export default facetDefinitions;
