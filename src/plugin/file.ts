/**
 * Represents a file being processed by the plugin.
 */
export interface IFile
{
    /**
     * Gets or sets the contents of the file.
     */
    contents: string;

    /**
     * Gets or sets the absolute path of the file.
     */
    path: string;

    /**
     * Gets or sets the base path inferred from the glob that matched the file.
     * Note that if this is undefined, a base path must be specified in the task config.
     */
    base?: string;
}
