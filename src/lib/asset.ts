/** Präfix für statische Dateien, wenn die Seite unter einem Unterpfad (GitHub Pages) liegt. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const asset = (path: string) => `${BASE_PATH}${path}`;
