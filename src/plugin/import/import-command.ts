import * as util from "gulp-util";
import * as path from "path";
import * as through from "through2";
import * as chalk from "chalk";

import {ITemplateParser} from "../../core/template-parser/template-parser";
import {ImportFile} from "../../core/persistence/import/import-file";
import {ContentFile} from "../../core/persistence/content/content-file";

import {pluginName, PluginConfig} from "../plugin-config";
import {ImportCommandConfig} from "./import-command-config";

/**
 * Represents the command.
 */
export class ImportCommand
{
    private _config: PluginConfig;
    private _templateParser: ITemplateParser;

    /**
     * Creates a new instance of the ImportCommand type.
     * @param config The plugin configuration to use.
     * @param templateParser The ITemplateParser instance to use.
     */
    public constructor(config: PluginConfig, templateParser: ITemplateParser)
    {
        this._config = config;
        this._templateParser = templateParser;
    }

    /**
     * Creates the stream transform.
     * @param config The command configuration to use.
     * @returns The stream transform.
     */
    public create(config: ImportCommandConfig): NodeJS.ReadWriteStream
    {
        // Create the import file instances.
        let importContentFiles = this.getContentFiles(config);

        const _this = this;

        // Return the stream transform.
        return through.obj(function (file: util.File, encoding: string, callback: (err?: any, data?: any) => void)
        {
            const relativeFilePath = `./${path.relative(process.cwd(), file.path).replace(/\\/g, "/")}`;

            try
            {
                // Don't drop null-files from the stream.
                if (file.isNull())
                {
                    callback(null, file);
                    return;
                }

                // Don't support streams.
                if (file.isStream())
                {
                    throw new Error("This plugin command does not support streams.");
                }

                // Process the buffer contents.
                if (file.isBuffer())
                {
                    // If the file is not HTML, assume it is a content file.
                    if (path.extname(relativeFilePath) !== ".html")
                    {
                        // Read and parse the non-localized content file.
                        const contentFile = ContentFile.parse((file.contents as Buffer).toString(), path.extname(file.path));

                        for (let key of Object.keys(contentFile.contents))
                        {
                            // If enabled, prefix the content id with the file path.
                            if (_this._config.prefixIdsInContentFiles && !/^\.?\//.test(key))
                            {
                                const prefix = relativeFilePath.substring(0, relativeFilePath.length - path.extname(relativeFilePath).length);
                                key = `${prefix}:${key}`;
                            }

                            // Find the first matching content instance.
                            let localizedContent = _this.getImportContent(config, importContentFiles, relativeFilePath, key);

                            // Replace the content, if found.
                            if (localizedContent != null)
                            {
                                // If enabled, remove the localization attributes from the content.
                                if (config.preserveAnnotations !== "all")
                                {
                                    // Parse the content as a template, so we can remove any annotations.
                                    let contentTemplate = _this._templateParser.parse(localizedContent);

                                    contentTemplate.clean(config.preserveAnnotations);

                                    localizedContent = contentTemplate.toString();
                                }

                                contentFile.set(key, localizedContent);
                            }
                        }

                        // Replace the file contents.
                        file.contents = new Buffer(contentFile.stringify(path.extname(file.path)));
                    }
                    else
                    {
                        // Read and parse the file content to get a template instance.
                        const template = _this._templateParser.parse((file.contents as Buffer).toString());

                        // Inject the contents from the import file.
                        for (let content of template.contents)
                        {
                            // Find the first matching content instance.
                            let localizedContent = _this.getImportContent(config, importContentFiles, relativeFilePath, content.id);

                            // Replace the content, if found.
                            if (localizedContent != null)
                            {
                                // If enabled, remove the localization attributes from the content.
                                if (config.preserveAnnotations !== "all")
                                {
                                    // Parse the content as a template, so we can remove any annotations.
                                    let contentTemplate = _this._templateParser.parse(localizedContent);

                                    contentTemplate.clean(config.preserveAnnotations);

                                    localizedContent = contentTemplate.toString();
                                }

                                content.content = localizedContent;
                            }
                        }

                        // If enabled, remove the localization attributes from the template.
                        template.clean(config.preserveAnnotations);

                        // Replace the file contents.
                        file.contents = new Buffer(template.toString());
                    }
                }
            }
            catch (error)
            {
                callback(new util.PluginError(pluginName, `Error while processing file ${chalk.magenta(relativeFilePath)}: ${error.message}`));
                return;
            }

            // Notify stream engine that we are done with this file and push it back into the stream.
            callback(null, file);
        },
        function (callback: () => void)
        {
            // Notify stream engine that we are all done.
            callback();
        });
    }

    /**
     * Loads the import files specified in the command config.
     * @param config The command config.
     * @returns The array of import file instances.
     */
    private getContentFiles(config: ImportCommandConfig): ImportFile[]
    {
        let importContentFiles: ImportFile[];

        importContentFiles = config.importFilePaths.map(importFilePath =>
        {
            try
            {
                return ImportFile.load(importFilePath);
            }
            catch (error)
            {
                throw new util.PluginError(pluginName, `Error while loading file ${chalk.magenta(importFilePath)}: ${error.message}`);
            }
        });

        return importContentFiles;
    }

    /**
     * Gets the first matching content in the import files.
     * @param config The command config.
     * @param importContentFiles The import file instances in which to look for the content.
     * @param relativeFilePath The relative path for the file being processed.
     * @param key The key for which content should be returned.
     * @returns The matching content, or undefined if no content is found and missing content is allowed.
     */
    private getImportContent(config: ImportCommandConfig, importContentFiles: ImportFile[], relativeFilePath: string, key: string): string|undefined
    {
        // Find the first matching content instance.

        let localizedContent;

        for (let importContentFile of importContentFiles)
        {
            localizedContent = importContentFile.get(relativeFilePath, key);

            if (localizedContent != null)
            {
                break;
            }
        }

        // Handle missing content.
        if (localizedContent == null)
        {
            if (config.missingContentHandling === "warn")
            {
                console.log(`${chalk.bgYellow.black("WARN")} The content for key '${chalk.cyan(key)}' in file '${chalk.magenta(relativeFilePath)}' was not found in the import file.`);
            }
            else if (config.missingContentHandling === "error")
            {
                throw new Error(`The content for key '${chalk.cyan(key)}' in file '${chalk.magenta(relativeFilePath)}' was not found in the import file.`);
            }
        }

        return localizedContent;
    }
}
