export default function loadTemplate(template, arguments_) {
  for (const key of Object.keys(arguments_)) {
    template = template.replace(new RegExp('\\$' + key, 'g'), arguments_[key]);
  }

  return template;
}
