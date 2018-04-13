import chalk from "chalk";
import { AnnotationsOption } from "../../core/template-parser/template-parser";

/**
 * Represents the action to take when encountering content that is marked as
 * localizable but not found in the import file.
 */
export type MissingContentOption = "error" | "warn" | "ignore";

/**
 * Represents the function to call when encountering content that is marked
 * as localizable but not found in the import file. This may return the
 * content, if found, or undefined if not found. Alternatively it may return
 * a promise for the content, which may be rejected if not found.
 * Note that if rejected with an instance of Error, it will be re-thrown.
 * @param id The id for which content should be returned.
 * @param filePath The file path, relative to the base path, for the file.
 * @returns The content, a promise for the content, or undefined. Note that
 * if the content is resolved to null, it will be ignored, and the missing
 * content handling will not be applied. This is useful for partial imports,
 * where you want to selectively suppress warnings or errors for content that
 * is known to be missing.
 */
export type MissingContentHandler =
    (id: string, filePath: string) => string | null | Promise<string | null> | undefined;

/**
 * Represents the task configuration.
 */
export interface IImportTaskConfig
{
    /**
     * The absolute path for the import file from which the contents should
     * be loaded, or an array of paths, if import should be attempted from
     * multiple import files. If multiple files are specified, the first
     * match for each content id will be used. If undefined, it is up to the
     * missing content handler to locate the content.
     * Default is undefined.
     */
    importFilePath?: string | string[];

    /**
     * The translate annotations to preserve, where 'none' preserves no
     * annotations, 'standard' preserves HTML compliant annotations,
     * 'normalize' preserves all annotations but normalizes them to either
     * 'yes' or 'no', and 'all' preserves all annotations without changes.
     * Default is 'none'.
     */
    preserveAnnotations?: AnnotationsOption;

    /**
     * The function to call when encountering content that is marked as
     * localizable but not found in the import file. This allows content
     * to be imported from other sources, such as e.g. a CMS system.
     * If the missing content is still not found, normal missing content
     * handling will be applied, unless the content is resolved to null,
     * in which case it will be ignored.
     * Default is undefined.
     */
    missingContentHandler?: MissingContentHandler;

    /**
     * The action to take when encountering content that is marked as
     * localizable but not found in the import file or by the missing
     * content handler, where 'error' causes an error to be thrown, 'log'
     * logs a warning to the console, and 'ignore' ignores the content.
     * Default is 'error'.
     */
    missingContentHandling?: MissingContentOption;

    /**
     * The base path to use when determining the relative path of files being
     * processed. This affects the prefixes applied to ids in content files.
     * Specify this if you need those paths to be based on a path other than
     * the base path inferred from the globs, or specified as the 'base'
     * option for the Gulp 'src' method.
     * Default is undefined.
     */
    baseFilePath?: string;
}

/**
 * Represents the task configuration.
 */
export class ImportTaskConfig
{
    /**
     * Creates a new instance of the ImportTaskConfig type.
     * @param config The config object from which the instance should be created.
     */
    public constructor(config: IImportTaskConfig)
    {
        if (config == undefined)
        {
            throw new Error(`The '${chalk.cyan("config")}' argument is required.`);
        }

        if (config.importFilePath != undefined)
        {
            this.importFilePaths = typeof config.importFilePath === "string" ? [config.importFilePath] : config.importFilePath;
        }
        else
        {
            this.importFilePaths = [];
        }

        if (config.preserveAnnotations != undefined)
        {
            this.preserveAnnotations = config.preserveAnnotations;
        }

        if (config.missingContentHandler != undefined)
        {
            this.missingContentHandler = config.missingContentHandler;
        }

        if (config.missingContentHandling != undefined)
        {
            this.missingContentHandling = config.missingContentHandling;
        }

        if (config.baseFilePath !== undefined)
        {
            this.baseFilePath = config.baseFilePath;
        }
    }

    /**
     * The absolute path for the import file from which the contents should
     * be loaded, or an array of paths, if import should be attempted from
     * multiple import files. If multiple files are specified, the first
     * match for each content id will be used.
     */
    public importFilePaths: string[];

    /**
     * The translate annotations to preserve, where 'none' preserves no
     * annotations, 'standard' preserves HTML compliant annotations,
     * 'normalize' preserves all annotations but normalizes them to either
     * 'yes' or 'no', and 'all' preserves all annotations without changes.
     */
    public preserveAnnotations: AnnotationsOption = "none";

    /**
     * The function to call when encountering content that is marked as
     * localizable but not found in the import file. This allows content
     * to be imported from other sources, such as e.g. a CMS system.
     * If the missing content is still not found, normal missing content
     * handling will be applied, unless the content is resolved to null,
     * in which case it will be ignored.
     */
    public missingContentHandler?: MissingContentHandler;

    /**
     * The action to take when encountering content that is marked as
     * localizable but not found in the import file or by the missing
     * content handler, where 'error' causes an error to be thrown, 'log'
     * logs a warning to the console, and 'ignore' ignores the content.
     */
    public missingContentHandling: MissingContentOption = "error";

    /**
     * The base path to use when determining the relative path of files being
     * processed. This affects the prefixes applied to ids in content files.
     * Specify this if you need those paths to be based on a path other than
     * the base path inferred from the globs, or specified as the 'base'
     * option for the Gulp 'src' method.
     */
    public baseFilePath?: string;
}
