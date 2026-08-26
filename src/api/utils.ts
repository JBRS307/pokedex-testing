export function capitalize(word: string | undefined) {
  if (word === undefined) {
    return '';
  }
  return word.charAt(0).toUpperCase() + word.slice(1);
}
