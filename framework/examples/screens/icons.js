StudioIconGallery.mount({
  names: dsIcon.builtins().sort(),
  render: (name, options) => dsIcon(name, options),
  code: name => "dsIcon('" + name + "', { size: 24 })",
  weights: dsIcon.weights(),
  currentWeight: dsIcon.weight(),
  setWeight: value => dsIcon.setWeight(value)
});
