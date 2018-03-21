import * as path from "path";
import chalk from "chalk";

import { TemplateParserConfig } from "../../core/template-parser/template-parser-config";
import { ExportFile } from "../../core/file-formats/export/export-file";
import { ImportFile } from "../../core/file-formats/import/import-file";

import { IContentTranslator } from "../../core/content-translator/content-translator";
import { NullContentTranslator } from "../../core/content-translator/implementations/null/null-content-translator";
import { PseudoContentTranslator } from "../../core/content-translator/implementations/pseudo/pseudo-content-translator";

import { File } from "../file";
import { PluginConfig } from "../plugin-config";
import { IPluginTask } from "../plugin-task";

import { TranslateTaskConfig } from "./translate-task-config";

/**
 * Represents the task.
 */
export class TranslateTask implements IPluginTask
{
    private _pluginConfig: PluginConfig;
    private _taskConfig: TranslateTaskConfig;
    private _templateParserConfig: TemplateParserConfig;

    /**
     * Creates a new instance of the TranslateTask type.
     * @param pluginConfig The plugin configuration to use.
     * @param taskConfig The task configuration to use.
     * @param templateParserConfig The template parser configuration to use.
     */
    public constructor(pluginConfig: PluginConfig, taskConfig: TranslateTaskConfig, templateParserConfig: TemplateParserConfig)
    {
        this._pluginConfig = pluginConfig;
        this._taskConfig = taskConfig;
        this._templateParserConfig = templateParserConfig;
    }

    /**
     * Processes the specified file.
     * @param file The file to process.
     * @returns A promise that will be resolved with the processed file.
     */
    public async process(file: File): Promise<File>
    {
        const filePathRelativeToCwd = file.getRelativePath();

        try
        {
            // Read and parse the non-localized export file.
            const exportFile = ExportFile.parse(file.contents, path.extname(file.absolutePath));

            // Create the new import file instance.
            const importFile = new ImportFile();

            // Create the translator.
            const contentTranslator = this.getContentTranslator(this._taskConfig.translator);

            // Translate the contents and add it to the import file.
            for (const id of Object.keys(exportFile.contents))
            {
                const content = exportFile.contents[id].content;
                importFile.set("./", id, contentTranslator.translate(content));
            }

            // Write the localized input file to the destination.
            file.contents = importFile.stringify(this._taskConfig.fileNameExtension || path.extname(file.absolutePath));

            // Return the processed file.
            return file;
        }
        catch (error)
        {
            throw new Error(`Error while processing file ${chalk.magenta(filePathRelativeToCwd)}:\n${error.message}`);
        }
    }

    /**
     * Geta a named content translator implementation, or the specified instance.
     */
    private getContentTranslator(nameOrInstance: undefined | string | IContentTranslator): IContentTranslator
    {
        if (nameOrInstance == null)
        {
            return new NullContentTranslator();
        }

        if (typeof nameOrInstance === "string")
        {
            switch (nameOrInstance)
            {
                case "pseudo": return new PseudoContentTranslator(this._templateParserConfig, this._pluginConfig.templateLanguage);
                default: throw new Error(`The content translator '${chalk.cyan(nameOrInstance)}' is not supported.`);
            }
        }

        return nameOrInstance as IContentTranslator;
    }
}
