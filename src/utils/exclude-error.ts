export function checkExclusion(errorMessage: string, excludes: string[]): [boolean, string] {
  for (const exclude of excludes) {
    if (errorMessage.toLowerCase().includes(exclude.toLowerCase())) {
      return [true, exclude];
    }
  }

  return [false, ""];
}
