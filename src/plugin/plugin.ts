import { ContentHash } from "../core/content-hash/implementation/content-hash";
import { ContentWhitespace } from "../core/content-whitespace/implementation/content-whitespace";
import { ITemplateParser } from "../core/template-parser/template-parser";
import { TemplateParserConfig } from "../core/template-parser/template-parser-config";
import { CheerioTemplateParser } from "../core/template-parser/implementation/template-parser";

import { IPluginConfig, PluginConfig } from "./plugin-config";

import { ExportTask } from "./export/export-task";
import { IExportTaskConfig, ExportTaskConfig } from "./export/export-task-config";

import { ImportTask } from "./import/import-task";
import { IImportTaskConfig, ImportTaskConfig } from "./import/import-task-config";

import { TranslateTask } from "./translate/translate-task";
import { ITranslateTaskConfig, TranslateTaskConfig } from "./translate/translate-task-config";

/**
 * Represents the plugin.
 */
export class Plugin
{
    private readonly _config: PluginConfig;
    private readonly _templateParserConfig: TemplateParserConfig;
    private readonly _templateParser: ITemplateParser;

    /**
     * Creates a new instance of the Plugin type.
     * @param config The plugin configuration to use, or undefined to use the default.
     */
    public constructor(config?: IPluginConfig)
    {
        this._config = new PluginConfig(config);
        this._templateParserConfig = new TemplateParserConfig(this._config);
        const templateWhitespace = new ContentWhitespace();
        const contentHash = new ContentHash(this._config.hashLength);
        this._templateParser = new CheerioTemplateParser(this._templateParserConfig, this._config.templateLanguage, templateWhitespace, contentHash);
    }

    /**
     * Exports the localized content from the HTML file being processed, into a localizable JSON file.
     * @param config The task configuration to use, or undefined to use the default.
     * @returns A task for processing files.
     */
    public export(config: IExportTaskConfig): ExportTask
    {
        const exportConfig = new ExportTaskConfig(config);
        const exportTask = new ExportTask(this._config, exportConfig, this._templateParser);

        return exportTask;
    }

    /**
     * Imports the localized content from a localized JSON file, into the HTML file being processed.
     * @param config The task configuration to use.
     * @returns A task for processing files.
     */
    public import(config: IImportTaskConfig): ImportTask
    {
        const importConfig = new ImportTaskConfig(config);
        const importTask = new ImportTask(this._config, importConfig, this._templateParser);

        return importTask;
    }

    /**
     * Simulates translation by creating an import file based on the content of the export file, optionally applying pseudo-localization to the content.
     * @param config The task configuration to use, or undefined to use the default.
     * @returns A task for processing files.
     */
    public translate(config: ITranslateTaskConfig): TranslateTask
    {
        const translateConfig = new TranslateTaskConfig(config);
        const translateTask = new TranslateTask(this._config, translateConfig, this._templateParserConfig);

        return translateTask;
    }
}
