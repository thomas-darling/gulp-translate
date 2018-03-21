import chalk from "chalk";
import { AnnotationsOption } from "../../core/template-parser/template-parser";

/**
 * Represents the task configuration.
 */
export interface IExportTaskConfig
{
    /**
     * The absolute path for the export file to which the contents should be
     * saved, or undefined to process the file without exporting its contents.
     * Default is undefined.
     */
    exportFilePath?: string;

    /**
     * True to update an existing export file, false to create a new file.
     * Default is false.
     */
    updateExportFile?: boolean;

    /**
     * True to normalize the content to ensure it has the same whitespace,
     * etc. as it would after importing content, otherwise false.
     * Default is false.
     */
    normalizeContent?: boolean;

    /**
     * The translate annotations to preserve, where 'none' preserves no
     * annotations, 'standard' preserves HTML compliant annotations,
     * 'normalize' preserves all annotations but normalizes them to either
     * 'yes' or 'no', and 'all' preserves all annotations without changes.
     * Default is 'none'.
     */
    preserveAnnotations?: AnnotationsOption;

    /**
     * True to replace the content with its id, otherwise false. The value
     * may also be a string, in which case the content will be replaced with
     * an id formatted according to the string, where '*' represents the id.
     * Use this if you prefer injecting the localized content on the
     * client-side, e.g. by replacing ids formatted as placeholders, such as
     * '{{*}}', during template loading, by formatting the ids as actual
     * binding expressions, such as '${translations[*]}', or by otherwise
     * attaching behaviour to the annotations.
     * Default is false.
     */
    replaceWithIds?: boolean | string;

    /**
     * True to export content for which the 'id' option is specified,
     * otherwise false. This can be overridden by the 'export' option.
     * Default false.
     */
    exportForId?: boolean;

    /**
     * True to log a warning to the console, if the content of a direct
     * annotation looks suspiciously like annotation options, indicating
     * that it might actually be an orphaned annotation.
     * Default is true.
     */
    logSuspectedOrphans?: boolean;

    /**
     * The base path to use when determining the relative path of files being
     * processed. This affects the source paths in export files and prefixes
     * applied to ids in content files. Specify this if you need those paths
     * to be based on a path other than the base path inferred from the globs,
     * or specified as the 'base' option for the Gulp 'src' method.
     * Default is undefined.
     */
    baseFilePath?: string;
}

/**
 * Represents the task configuration.
 */
export class ExportTaskConfig
{
    /**
     * Creates a new instance of the ExportTaskConfig type.
     * @param config The config object from which the instance should be created.
     */
    public constructor(config: IExportTaskConfig)
    {
        if (config === undefined)
        {
            return;
        }

        if (config.exportFilePath !== undefined)
        {
            this.exportFilePath = config.exportFilePath;
        }

        if (config.updateExportFile !== undefined)
        {
            this.updateExportFile = config.updateExportFile;
        }

        if (config.normalizeContent !== undefined)
        {
            this.normalizeContent = config.normalizeContent;
        }

        if (config.preserveAnnotations !== undefined)
        {
            this.preserveAnnotations = config.preserveAnnotations;
        }

        if (config.replaceWithIds !== undefined)
        {
            if (typeof config.replaceWithIds === "string" && !/^([^*]*[*][^*]*)$/.test(config.replaceWithIds)) {
                throw new Error(`The '${chalk.cyan("replaceWithIds")}' option must be ${chalk.cyan("undefined")}, a ${chalk.cyan("boolean")}, or a string containing exactly one '${chalk.cyan("*")}'.`);
            }

            this.replaceWithIds = config.replaceWithIds;
        }

        if (config.exportForId !== undefined)
        {
            this.exportForId = config.exportForId;
        }

        if (config.logSuspectedOrphans !== undefined)
        {
            this.logSuspectedOrphans = config.logSuspectedOrphans;
        }

        if (config.baseFilePath !== undefined)
        {
            this.baseFilePath = config.baseFilePath;
        }
    }

    /**
     * The absolute path for the export file to which the contents should be
     * saved, or undefined to process the file without exporting its contents.
     */
    public exportFilePath?: string;

    /**
     * True to update to an existing export file, false to create a new file.
     */
    public updateExportFile: boolean = false;

    /**
     * True to normalize the content to ensure it has the same whitespace,
     * etc. as it would after importing content, otherwise false.
     */
    public normalizeContent: boolean = false;

    /**
     * The translate annotations to preserve, where 'none' preserves no
     * annotations, 'standard' preserves HTML compliant annotations,
     * 'normalize' preserves all annotations but normalizes them to either
     * 'yes' or 'no', and 'all' preserves all annotations without changes.
     */
    public preserveAnnotations: AnnotationsOption = "none";

    /**
     * True to replace the content with its id, otherwise false. The value
     * may also be a string, in which case the content will be replaced with
     * an id formatted according to the string, where '*' represents the id.
     * Use this if you prefer injecting the localized content on the
     * client-side, e.g. by replacing ids formatted as placeholders, such as
     * '{{*}}', during template loading, by formatting the ids as actual
     * binding expressions, such as '${translations[*]}', or by otherwise
     * attaching behaviour to the annotations.
     */
    public replaceWithIds: boolean | string = false;

    /**
     * True to export content for which the 'id' option is specified,
     * otherwise false. This can be overridden by the 'export' option.
     */
    public exportForId: boolean = false;

    /**
     * True to log a warning to the console, if the content of a direct
     * annotation looks suspiciously like annotation options, indicating
     * that it might actually be an orphaned annotation.
     */
    public logSuspectedOrphans: boolean = true;

    /**
     * The base path to use when determining the relative path of files being
     * processed. This affects the source paths in export files and prefixes
     * applied to ids in content files. Specify this if you need those paths
     * to be based on a path other than the base path inferred from the globs,
     * or specified as the 'base' option for the Gulp 'src' method.
     */
    public baseFilePath?: string;
}
