import * as util from "gulp-util";
import * as path from "path";
import * as chalk from "chalk";
import * as through from "through2";

import {ITemplateParser} from "../../core/template-parser/template-parser";
import {ExportFile} from "../../core/persistence/export/export-file";
import {ContentFile} from "../../core/persistence/content/content-file";

import {pluginName, PluginConfig} from "../plugin-config";
import {ExportCommandConfig} from "./export-command-config";

/**
 * Represents the command.
 */
export class ExportCommand
{
    private _config: PluginConfig;
    private _templateParser: ITemplateParser;

    /**
     * Creates a new instance of the ExportCommand type.
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
    public create(config: ExportCommandConfig): NodeJS.ReadWriteStream
    {
        let exportContentFile: ExportFile;

        // If enabled, create the new export file instance.
        if (config.exportFilePath)
        {
            try
            {
                exportContentFile = config.updateExportFile ? ExportFile.load(config.exportFilePath) : new ExportFile();
            }
            catch (error)
            {
                throw new util.PluginError(pluginName, `Error while loading file ${chalk.magenta(config.exportFilePath)}: ${error.message}`);
            }
        }

        const _this = this;

        // Return the stream transform.
        return through.obj(function (file: util.File, encoding: string, callback: (err?: any, data?: any) => void)
        {
            let relativeFilePath = `./${path.relative(process.cwd(), file.path).replace(/\\/g, "/")}`;

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

                        // If enabled, add the contents to the export file.
                        if (config.exportFilePath)
                        {
                            for (let key of Object.keys(contentFile.contents))
                            {
                                exportContentFile.set(relativeFilePath, key, contentFile.contents[key]);
                            }
                        }
                    }
                    else
                    {
                        // Read and parse the template file to get a template instance.
                        const template = _this._templateParser.parse((file.contents as Buffer).toString());

                        // If enabled, log a warning if the content looks suspiciously like an orphaned annotation.
                        if (config.logSuspectedOrphans)
                        {
                            for (let content of template.contents.filter(c => c.annotation.isSuspectedOrphan))
                            {
                                console.log(`${chalk.bgYellow.black("WARN")} The direct annotation with content '${chalk.cyan(content.content)}' in file ${chalk.magenta(relativeFilePath)} could be an orphaned annotation.`);
                            }
                        }

                        // If enabled, add the contents to the export file.
                        if (config.exportFilePath)
                        {
                            for (let content of template.contents)
                            {
                                if (content.annotation.options.export != null ? content.annotation.options.export : config.exportForId || content.annotation.options.id == null)
                                {
                                    exportContentFile.set(relativeFilePath, content.id, content.content, content.annotation.options.hint, content.annotation.options.context);
                                }
                            }
                        }

                        // If enabled, replace each content instance in the template file with its id.
                        if (config.replaceWithIds)
                        {
                            if (typeof config.replaceWithIds === "string")
                            {
                                for (let content of template.contents)
                                {
                                    content.content = config.replaceWithIds.replace("*", content.id);
                                }
                            }
                            else
                            {
                                for (let content of template.contents)
                                {
                                    content.content = content.id;
                                }
                            }
                        }

                        // If enabled, normalize the content to ensure we get the same whitespace, etc. as we would after importing content.
                        else if (config.normalizeContent)
                        {
                            for (let content of template.contents)
                            {
                                content.content = content.content
                            }
                        }

                        // If enabled, remove the localization attributes from the template.
                        template.clean(config.preserveAnnotations);

                        // If needed, replace the contents of the template file.
                        if (config.replaceWithIds || config.normalizeContent || config.preserveAnnotations !== "all")
                        {
                            file.contents = new Buffer(template.toString());
                        }
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
            //  If enabled, save the export file.
            if (config.exportFilePath)
            {
                exportContentFile.save(config.exportFilePath);
            }

            // Notify stream engine that we are all done.
            callback();
        });
    }
}
