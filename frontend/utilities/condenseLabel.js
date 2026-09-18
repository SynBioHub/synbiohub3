// drops the "prefix:" and/or "category/" from a short name for display
// (so:engineered_region -> engineered_region, partType/RBS -> RBS)
export const condenseLabel = label => {
  const afterPrefix = label.includes(':')
    ? label.slice(label.lastIndexOf(':') + 1)
    : label;
  return afterPrefix.includes('/')
    ? afterPrefix.slice(afterPrefix.lastIndexOf('/') + 1)
    : afterPrefix;
};
