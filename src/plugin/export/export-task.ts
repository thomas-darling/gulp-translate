import * as path from "path";
import chalk from "chalk";

import { ITemplateParser } from "../../core/template-parser/template-parser";
import { ExportFile } from "../../core/file-formats/export/export-file";
import { ContentFile } from "../../core/file-formats/content/content-file";
import { getPrefixedContentId } from "../../core/utilities";

import { IFile } from "../file";
import { getRelativePath } from "../utilities";
import { PluginConfig } from "../plugin-config";
import { IPluginTask } from "../plugin-task";

import { ExportTaskConfig } from "./export-task-config";

/**
 * Represents the task.
 */
export class ExportTask implements IPluginTask
{
    private _pluginConfig: PluginConfig;
    private _taskConfig: ExportTaskConfig;
    private _templateParser: ITemplateParser;
    private _exportContentFile: ExportFile;

    /**
     * Creates a new instance of the ExportTask type.
     * @param pluginConfig The plugin configuration to use.
     * @param taskConfig The task configuration to use.
     * @param templateParser The ITemplateParser instance to use.
     */
    public constructor(pluginConfig: PluginConfig, taskConfig: ExportTaskConfig, templateParser: ITemplateParser)
    {
        this._pluginConfig = pluginConfig;
        this._taskConfig = taskConfig;
        this._templateParser = templateParser;

        // If enabled, create the new export file instance.
        if (taskConfig.exportFilePath)
        {
            try
            {
                this._exportContentFile = taskConfig.updateExportFile ? ExportFile.load(taskConfig.exportFilePath) : new ExportFile();
            }
            catch (error)
            {
                throw new Error(`Error while loading file ${chalk.magenta(taskConfig.exportFilePath)}:\n${error.message}`);
            }
        }
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

                // If enabled, add the contents to the export file.
                if (this._taskConfig.exportFilePath)
                {
                    for (const key of Object.keys(contentFile.contents))
                    {
                        const content = contentFile.contents[key];

                        let id = key;

                        // If enabled, prefix the content id with the relative file path.
                        if (this._pluginConfig.prefixIdsInContentFiles)
                        {
                            id = getPrefixedContentId(id, filePathRelativeToBase);
                        }

                        this._exportContentFile.set(filePathRelativeToBase, id, content);
                    }
                }
            }
            else
            {
                // Read and parse the template file to get a template instance.
                const template = this._templateParser.parse(file.contents);

                // If enabled, log a warning if the content looks suspiciously like an orphaned annotation.
                if (this._taskConfig.logSuspectedOrphans)
                {
                    for (const content of template.contents.filter(c => c.annotation.isSuspectedOrphan))
                    {
                        console.log(`${chalk.bgYellow.black("WARN")} The direct annotation with content '${chalk.cyan(content.content)}' in file ${chalk.magenta(filePathRelativeToCwd)} could be an orphaned annotation.`);
                    }
                }

                // If enabled, add the contents to the export file.
                if (this._taskConfig.exportFilePath)
                {
                    for (const content of template.contents)
                    {
                        if (content.annotation.options.export != null ? content.annotation.options.export : this._taskConfig.exportForId || content.annotation.options.id == null)
                        {
                            this._exportContentFile.set(filePathRelativeToBase, content.id, content.content, content.annotation.options.hint, content.annotation.options.context);
                        }
                    }
                }

                // If enabled, replace each content instance in the template file with its id.
                if (this._taskConfig.replaceWithIds)
                {
                    if (typeof this._taskConfig.replaceWithIds === "string")
                    {
                        for (const content of template.contents)
                        {
                            content.content = this._taskConfig.replaceWithIds.replace("*", content.id);
                        }
                    }
                    else
                    {
                        for (const content of template.contents)
                        {
                            content.content = content.id;
                        }
                    }
                }

                // If enabled, normalize the content to ensure we get the same whitespace, etc. as we would after importing content.
                else if (this._taskConfig.normalizeContent)
                {
                    for (const content of template.contents)
                    {
                        content.content = content.content;
                    }
                }

                // If enabled, remove the localization attributes from the template.
                template.clean(this._taskConfig.preserveAnnotations);

                // If needed, replace the contents of the template file.
                if (this._taskConfig.replaceWithIds || this._taskConfig.normalizeContent || this._taskConfig.preserveAnnotations !== "all")
                {
                    file.contents = template.toString();
                }
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
     * Finalizes the task.
     * @returns A promise that will be resolved when the task has finalized its work.
     */
    public async finalize(): Promise<void>
    {
        //  If enabled, save the export file.
        if (this._taskConfig.exportFilePath)
        {
            this._exportContentFile.save(this._taskConfig.exportFilePath);
        }
    }
}
