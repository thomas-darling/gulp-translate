import * as util from "gulp-util";
import * as path from "path";
import * as through from "through2";
import * as chalk from "chalk";

import {ContentHash} from "../core/content-hash/implementation/content-hash";
import {ContentWhitespace} from "../core/content-whitespace/implementation/content-whitespace";

import {ITemplateLanguage} from "../core/template-language/template-language";
import {NullTemplateLanguage} from "../core/template-language/implementations/null/null-template-language";
import {AureliaTemplateLanguage} from "../core/template-language/implementations/aurelia/aurelia-template-language";
import {AngularTemplateLanguage} from "../core/template-language/implementations/angular/angular-template-language";

import {ITemplateParser} from "../core/template-parser/template-parser";
import {TemplateParserConfig} from "../core/template-parser/template-parser-config";
import {CheerioTemplateParser} from "../core/template-parser/implementation/template-parser";

import {IPluginConfig, PluginConfig} from "./plugin-config";

import {ExportCommand} from "./export/export-command";
import {IExportCommandConfig, ExportCommandConfig} from "./export/export-command-config";

import {ImportCommand} from "./import/import-command";
import {IImportCommandConfig, ImportCommandConfig} from "./import/import-command-config";

import {TranslateCommand} from "./translate/translate-command";
import {ITranslateCommandConfig, TranslateCommandConfig} from "./translate/translate-command-config";

/**
 * Represents the plugin.
 */
export class Plugin
{
    private _config: PluginConfig;
    private _templateLanguage: ITemplateLanguage;
    private _templateParserConfig: TemplateParserConfig;
    private _templateParser: ITemplateParser;

    /**
     * Creates a new instance of the Plugin type.
     * @param config The plugin configuration to use, or undefined to use the default.
     */
    public constructor(config?: IPluginConfig)
    {
        this._config = new PluginConfig(config);
        this._templateLanguage = this.getTemplateLanguage(this._config.templateLanguage);
        this._templateParserConfig = new TemplateParserConfig(this._config);
        const templateWhitespace = new ContentWhitespace();
        const contentHash = new ContentHash(this._config.hashLength);
        this._templateParser = new CheerioTemplateParser(this._templateParserConfig, this._templateLanguage, templateWhitespace, contentHash);
    }

    /**
     * Exports the localized content from the HTML file being processed, into a localizable JSON file.
     * @param config The command configuration to use, or undefined to use the default.
     */
    public export(config: IExportCommandConfig): NodeJS.ReadWriteStream
    {
        const exportCommand = new ExportCommand(this._config, this._templateParser);
        return exportCommand.create(new ExportCommandConfig(config));
    }

    /**
     * Imports the localized content from a localized JSON file, into the HTML file being processed.
     * @param config The command configuration to use.
     */
    public import(config: IImportCommandConfig): NodeJS.ReadWriteStream
    {
        const importCommand = new ImportCommand(this._config, this._templateParser);
        return importCommand.create(new ImportCommandConfig(config));
    }

    /**
     * Simulates translation by creating an import file based on the content of the export file, optionally applying pseudo-localization to the content.
     * Note that this command is a simple function, and not a stream transform.
     * @param config The command configuration to use, or undefined to use the default.
     */
    public translate(config: ITranslateCommandConfig): NodeJS.ReadWriteStream
    {
        const translateCommand = new TranslateCommand(this._config, this._templateParserConfig, this._templateLanguage);
        return translateCommand.create(new TranslateCommandConfig(config));
    }

    /**
     * Gets a named template language implementation, or the specified instance.
     */
    private getTemplateLanguage(nameOrInstance: undefined|string|ITemplateLanguage): ITemplateLanguage
    {
        if (nameOrInstance == null)
        {
            return new NullTemplateLanguage();
        }

        if (typeof nameOrInstance === "string")
        {
            switch (nameOrInstance)
            {
                case "aurelia": return new AureliaTemplateLanguage();
                case "angular": return new AngularTemplateLanguage();
                default: throw new Error(`The template language '${chalk.cyan(nameOrInstance)}' is not supported.`);
            }
        }

        return nameOrInstance as ITemplateLanguage;
    }
}
