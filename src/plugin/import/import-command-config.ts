import * as chalk from "chalk";
import {AnnotationsOption} from "../../core/template-parser/template-parser";

/**
 * Represents the action to take when encountering content that is marked as localizable
 * but not found in the import file.
 */
export type MissingContentOption = "error"|"warn"|"ignore";

/**
 * Represents the command configuration.
 */
export interface IImportCommandConfig
{
    /**
     * The absolute path for the import file from which the contents should
     * be loaded, or an array of paths, if import should be attempted from
     * multiple import files. If multiple files are specified, the first
     * match for each content id will be used.
     */
    importFilePath: string|string[];

    /**
     * The translate annotations to preserve, where 'none' preserves no
     * annotations, 'standard' preserves HTML compliant annotations,
     * 'normalize' preserves all annotations but normalizes them to either
     * 'yes' or 'no', and 'all' preserves all annotations without changes.
     * Default is 'none'.
     */
    preserveAnnotations?: AnnotationsOption;

    /**
     * The action to take when encountering content that is marked as
     * localizable but not found in the import file, where 'error' causes
     * an error to be thrown, 'log' logs a warnign to the console, and
     * 'ignore' silently ignores the content.
     * Default is 'error'.
     */
    missingContentHandling?: MissingContentOption;
}

/**
 * Represents the command configuration.
 */
export class ImportCommandConfig
{
    /**
     * Creates a new instance of the ImportCommandConfig type.
     * @param config The config object from which the instance should be created.
     */
    public constructor(config: IImportCommandConfig)
    {
        if (config == undefined)
            throw new Error(`The '${chalk.cyan("config")}' argument is required.`);

        if (config.importFilePath != undefined)
            this.importFilePaths = typeof config.importFilePath === "string" ? [config.importFilePath] : config.importFilePath;
        else
            throw new Error(`The '${chalk.cyan("importFilePath")}' option is required.`);

        if (config.preserveAnnotations != undefined)
            this.preserveAnnotations = config.preserveAnnotations;

        if (config.missingContentHandling != undefined)
            this.missingContentHandling = config.missingContentHandling;
    }

    /**
     * The absolute path for the import file from which the contents should
     * be loaded, or an array of paths, if import should be attempted from
     * multiple import files. If multiple files are specified, the first
     * match for each content id will be used.
     */
    importFilePaths: string[];

    /**
     * The translate annotations to preserve, where 'none' preserves no
     * annotations, 'standard' preserves HTML compliant annotations,
     * 'normalize' preserves all annotations but normalizes them to either
     * 'yes' or 'no', and 'all' preserves all annotations without changes.
     * Default is 'none'.
     */
    preserveAnnotations: AnnotationsOption = "none";

    /**
     * The action to take when encountering content that is marked as
     * localizable but not found in the import file, where 'error' causes
     * an error to be thrown, 'log' logs a warnign to the console, and
     * 'ignore' silently ignores the content.
     * Default is 'error'.
     */
    missingContentHandling: MissingContentOption = "error";
}
