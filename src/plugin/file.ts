import * as path from "path";

/**
 * Represents a file being processed by the plugin.
 */
export abstract class File
{
    /**
     * Gets or sets the contents of the file.
     */
    public abstract contents: string;

    /**
     * Gets or sets the absolute path of the file.
     */
    public abstract absolutePath: string;

    /**
     * Gets or sets the base path inferred from the glob that matched the file.
     */
    public abstract globBasePath: string;

    /**
     * Gets the relative file path for the specified file, relative to the specified base path, where the base path
     * may itself be relative to the current working directory. If no base path is specified, the current working
     * directory will be used.
     *
     * @example
     *
     * `file.getRelativePath(file.globBasePath)`
     * Use this to get a path for use as source in an export file or for prefixing ids in content files.
     *
     * `file.getRelativePath()`
     * Use this to get a path for use when referencing files or folders in log messages.
     *
     * @param basePath The base file path to use, or undefined to use the base path of the file.
     * @returns The relative file path.
     */
    public getRelativePath(basePath?: string): string
    {
        let relativeFilePath: string;

        if (basePath != null)
        {
            const absoluteBaseFilePath = path.isAbsolute(basePath) ? basePath : path.join(process.cwd(), basePath);

            relativeFilePath = path.relative(absoluteBaseFilePath, this.absolutePath);
        }
        else
        {
            relativeFilePath = path.relative(process.cwd(), this.absolutePath);
        }

        return `./${relativeFilePath.replace(/\\/g, "/")}`;
    }
}
