import * as path from "path";

/**
 * Prefixes the specified id using the specified content file path, thus producing an id that is unique to that file.
 * Example: Given the id 'baz' and the path './foo/bar.json', the prefixed id will be './foo/bar:baz'.
 * @param id The id to prefix.
 * @param relativeFilePath The relative file path used for the prefix, where the file name extension will be removed.
 * @returns The prefixed id, or just the id, if it already starts with './' or '/'.
 */
export function getPrefixedContentId(id: string, relativeFilePath: string): string
{
    // If the id is already prefixed, return it as-is.
    if (/^\.?\//.test(id))
    {
        return id;
    }

    // Prefix the content id with the relative file path.

    const prefix = relativeFilePath.substring(0, relativeFilePath.length - path.extname(relativeFilePath).length);

    return `${prefix}:${id}`;
}
