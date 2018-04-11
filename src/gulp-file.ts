import * as util from "gulp-util";

import { IFile } from "./plugin/file";

/**
 * Represents a file being processed by the plugin, implemented
 * as a wrapper around the Vinyl files used by Gulp.
 */
export class GulpFile implements IFile
{
    /**
     * Creates a new instance of the GulpFile type.
     * @param file The Vinyl instance to wrap.
     */
    public constructor(file: util.File)
    {
        if (file.isNull())
        {
            throw new Error("File contents is null.");
        }

        if (!file.isBuffer())
        {
            throw new Error("File contents is not a buffer.");
        }

        this.vinyl = file;
    }

    /**
     * Gets the wrapped Vinyl instance.
     */
    public readonly vinyl: util.File;

    /**
     * Gets the contents of the file.
     */
    public get contents(): string
    {
        return this.vinyl.contents!.toString();
    }

    /**
     * Sets the contents of the file.
     * @param value The new file contents.
     */
    public set contents(value: string)
    {
        this.vinyl.contents = new Buffer(value);
    }

    /**
     * Gets or sets the absolute path of the file.
     */
    public get path(): string
    {
        return this.vinyl.path;
    }

    /**
     * Sets the absolute path of the file.
     * @param value The new file path.
     */
    public set path(value: string)
    {
        this.vinyl.path = value;
    }

    /**
     * Gets the base path inferred from the glob that matched the file.
     */
    public get base(): string
    {
        return this.vinyl.base;
    }

    /**
     * Sets the base path inferred from the glob that matched the file.
     * @param value The new base path.
     */
    public set base(value: string)
    {
        this.vinyl.base = value;
    }
}
