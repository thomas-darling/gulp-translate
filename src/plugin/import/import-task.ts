import * as path from "path";
import chalk from "chalk";

import { ITemplateParser } from "../../core/template-parser/template-parser";
import { ImportFile } from "../../core/file-formats/import/import-file";
import { ContentFile } from "../../core/file-formats/content/content-file";
import { getPrefixedContentId } from "../../core/utilities";

import { IFile } from "../file";
import { getRelativePath } from "../utilities";
import { PluginConfig } from "../plugin-config";
import { IPluginTask } from "../plugin-task";

import { ImportTaskConfig } from "./import-task-config";

/**
 * Represents the task.
 */
export class ImportTask implements IPluginTask
{
    private _pluginConfig: PluginConfig;
    private _taskConfig: ImportTaskConfig;
    private _templateParser: ITemplateParser;
    private _importContentFiles: ImportFile[];

    /**
     * Creates a new instance of the ImportTask type.
     * @param pluginConfig The plugin configuration to use.
     * @param taskConfig The task configuration to use.
     * @param templateParser The ITemplateParser instance to use.
     */
    public constructor(pluginConfig: PluginConfig, taskConfig: ImportTaskConfig, templateParser: ITemplateParser)
    {
        this._pluginConfig = pluginConfig;
        this._taskConfig = taskConfig;
        this._templateParser = templateParser;

        // Create the import file instances.
        this._importContentFiles = this.getContentFiles(taskConfig);
    }

    /**
     * Processes the specified file.
     * @param file The file to process.
     * @returns A promise that will be resolved with the processed file.
     */
    public async process(file: IFile): Promise<IFile>
    {
        const filePathRelativeToCwd = getRelativePath(file.path);
        const filePathRelativeToBase = getRelativePath(file.path, this._taskConfig.baseFilePath || file.base);

        try
        {
            // If the file is not HTML, assume it is a content file.
            if (path.extname(filePathRelativeToBase) !== ".html")
            {
                // Read and parse the non-localized content file.
                const contentFile = ContentFile.parse(file.contents, path.extname(file.path));

                for (const key of Object.keys(contentFile.contents))
                {
                    let id = key;

                    // If enabled, prefix the content id with the relative file path.
                    if (this._pluginConfig.prefixIdsInContentFiles)
                    {
                        id = getPrefixedContentId(id, filePathRelativeToBase);
                    }

                    // Find the first matching content instance.
                    let localizedContent = await this.getImportContent(this._taskConfig, this._importContentFiles, filePathRelativeToBase, filePathRelativeToCwd, id);

                    // Replace the content, if found.
                    if (localizedContent != null)
                    {
                        // If enabled, remove the localization attributes from the content.
                        if (this._taskConfig.preserveAnnotations !== "all")
                        {
                            // Parse the content as a template, so we can remove any annotations.
                            const contentTemplate = this._templateParser.parse(localizedContent);

                            contentTemplate.clean(this._taskConfig.preserveAnnotations);

                            localizedContent = contentTemplate.toString();
                        }

                        contentFile.set(key, localizedContent);
                    }
                }

                // Replace the file contents.
                file.contents = contentFile.stringify(path.extname(file.path));
            }
            else
            {
                // Read and parse the file content to get a template instance.
                const template = this._templateParser.parse(file.contents);

                // Inject the contents from the import file.
                for (const content of template.contents)
                {
                    // Find the first matching content instance.
                    let localizedContent = await this.getImportContent(this._taskConfig, this._importContentFiles, filePathRelativeToBase, filePathRelativeToCwd, content.id);

                    // Replace the content, if found.
                    if (localizedContent != null)
                    {
                        // If enabled, remove the localization attributes from the content.
                        if (this._taskConfig.preserveAnnotations !== "all")
                        {
                            // Parse the content as a template, so we can remove any annotations.
                            const contentTemplate = this._templateParser.parse(localizedContent);

                            contentTemplate.clean(this._taskConfig.preserveAnnotations);

                            localizedContent = contentTemplate.toString();
                        }

                        content.content = localizedContent;
                    }
                }

                // If enabled, remove the localization attributes from the template.
                template.clean(this._taskConfig.preserveAnnotations);

                // Replace the file contents.
                file.contents = template.toString();
            }

            // Return the processed file.
            return file;
        }
        catch (error)
        {
            throw new Error(`Error while processing file ${chalk.magenta(filePathRelativeToCwd)}:\n${error.message}`);
        }
    }

    /**
     * Loads the import files specified in the task config.
     * @param config The task config.
     * @returns The array of import file instances.
     */
    private getContentFiles(config: ImportTaskConfig): ImportFile[]
    {
        const importContentFiles = config.importFilePaths.map(importFilePath =>
        {
            try
            {
                return ImportFile.load(importFilePath);
            }
            catch (error)
            {
                throw new Error(`Error while loading file ${chalk.magenta(importFilePath)}:\n${error.message}`);
            }
        });

        return importContentFiles;
    }

    /**
     * Gets the first matching content in the import files, or null if the content should be ignored.
     * @param config The task config.
     * @param importContentFiles The import file instances in which to look for the content.
     * @param filePathRelativeToBase The file path, relative to the base path, for the file being processed.
     * @param filePathRelativeToCwd The file path, relative to the current working directory, for the file being processed.
     * @param id The id for which content should be returned.
     * @returns The matching content, or null if no content is found and missing content is allowed.
     */
    private async getImportContent(config: ImportTaskConfig, importContentFiles: ImportFile[], filePathRelativeToBase: string, filePathRelativeToCwd: string, id: string): Promise<string | null>
    {
        // Find the first matching content instance.

        let localizedContent;

        for (const importContentFile of importContentFiles)
        {
            localizedContent = importContentFile.get(filePathRelativeToBase, id);

            if (localizedContent !== undefined)
            {
                break;
            }
        }

        // If not found in the import file, call the missing content handler, if specified.

        if (localizedContent === undefined && config.missingContentHandler != null)
        {
            const missingContentHandlerResult = config.missingContentHandler(id, filePathRelativeToBase);

            if (missingContentHandlerResult instanceof Promise)
            {
                try
                {
                    localizedContent = await missingContentHandlerResult;
                }
                catch (reason)
                {
                    // If the reason for the rejection is an error, we assume something actually went wrong.
                    if (reason instanceof Error)
                    {
                        throw reason;
                    }
                }
            }
            else
            {
                localizedContent = missingContentHandlerResult;
            }
        }

        // If still not found, handle the content as missing.

        if (localizedContent === undefined)
        {
            if (config.missingContentHandling === "warn")
            {
                console.log(`${chalk.bgYellow.black("WARN")} The content for id '${chalk.cyan(id)}' in file '${chalk.magenta(filePathRelativeToCwd)}' was not found in the import file or by the missing content handler.`);
            }
            else if (config.missingContentHandling === "error")
            {
                throw new Error(`The content for id '${chalk.cyan(id)}' in file '${chalk.magenta(filePathRelativeToCwd)}' was not found in the import file or by the missing content handler.`);
            }

            localizedContent = null;
        }

        return localizedContent;
    }
}
