import * as path from "path";

/**
 * Gets the relative file path for the specified file, relative to the specified base path, where the base path
 * may itself be relative to the current working directory. If no base path is specified, the current working
 * directory will be used.
 *
 * @example
 *
 * // Get a relative path for use as source in an export file or for prefixing ids in content files:
 * getRelativePath(file.absolutePath, file.globBasePath || taskConfig.baseFilePath)
 *
 * // Get a relative path for use when referencing files or folders in log messages:
 * getRelativePath(file.absolutePath)
 *
 * @param absolutePath The absolute path of the file for which a relative path should be returned.
 * @param basePath The base path to use, or undefined to use the current working directory.
 * @returns The relative file path.
 */
export function getRelativePath(absolutePath: string, basePath?: string): string
{
    let relativeFilePath: string;

    if (basePath != null)
    {
        const absoluteBaseFilePath = path.isAbsolute(basePath) ? basePath : path.join(process.cwd(), basePath);

        relativeFilePath = path.relative(absoluteBaseFilePath, absolutePath);
    }
    else
    {
        relativeFilePath = path.relative(process.cwd(), absolutePath);
    }

    return `./${relativeFilePath.replace(/\\/g, "/")}`;
}
