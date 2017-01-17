import * as util from "gulp-util";
import * as path from "path";

/**
 * Gets the relative file path for the specified file, relative to the specified base path, where the base path
 * may itself be relative to the current working directory. If no base path is specified, the base path inferred
 * from glob patterns and Gulp 'base' option will be used.
 * Use this to get a path for use as source in an export file or for prefixing ids in content files.
 * @param file The file for which the relative path should be returned.
 * @param baseFilePath The base file path to use, or undefined to use the base path of the file.
 * @returns The relative file path.
 */
export function getFilePathRelativeToBase(file: util.File, baseFilePath?: string): string
{
    let relativeFilePath: string;

    if (baseFilePath != null)
    {
        const absoluteBaseFilePath = path.isAbsolute(baseFilePath) ? baseFilePath : path.join(process.cwd(), baseFilePath);

        relativeFilePath = path.relative(absoluteBaseFilePath, file.path);
    }
    else
    {
        relativeFilePath = file.relative;
    }

    return `./${relativeFilePath.replace(/\\/g, "/")}`;
}

/**
 * Gets the relative file path for the specified file, relative to the current working directory.
 * Use this to get a path for use when referencing files or folders in log messages.
 * @param file The file for which the relative path should be returned.
 * @returns The relative file path.
 */
export function getFilePathRelativeToCwd(file: util.File): string
{
    let relativeFilePath = path.relative(process.cwd(), file.path);

    return `./${relativeFilePath.replace(/\\/g, "/")}`;
}

/**
 * Prefixes the specified id using the specified content file path, thus producing an id that is unique to that file.
 * Example: Given the id 'baz' and the path './foo/bar.json', the prefixed id will be './foo/bar:baz'.
 * @param id The id to prefix.
 * @param relativeFilePath The relative file path used for the prefix, where the file name extension will be removed.
 * @returns The prefixed id, or just the id, if it already starts with './' or '/'.
 */
export function getPrefixedContentId(id: string, relativeFilePath: string): string
{
    // If enabled, prefix the content id with the relative file path.
    if (!/^\.?\//.test(id))
    {
        const prefix = relativeFilePath.substring(0, relativeFilePath.length - path.extname(relativeFilePath).length);

        return `${prefix}:${id}`;
    }

    return id;
}