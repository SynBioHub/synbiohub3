export default function configureQuery(query, arguments_) {
  for (const key of Object.keys(arguments_)) {
    query = query.replace(new RegExp('\\$' + key, 'g'), arguments_[key]);
  }

  return query;
}
