export function getExtensionElement(element, type) {
  if (!element.extensionElements) {

    return;
  }

  return element.extensionElements.get('values').filter((extensionElement) => {
    return extensionElement.$instanceOf(type);
  })[0];
}


export function hasExtensionElement(element, type) {
  return getExtensionElement(element, type) !== undefined;
}
