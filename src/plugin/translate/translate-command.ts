import * as fs from "fs";
import * as path from "path";
import * as util from "gulp-util";
import * as chalk from "chalk";
import * as through from "through2";

import {ITemplateLanguage} from "../../core/template-language/template-language";
import {TemplateParserConfig} from "../../core/template-parser/template-parser-config";
import {ExportFile} from "../../core/persistence/export/export-file";
import {ImportFile} from "../../core/persistence/import/import-file";

import {IContentTranslator} from "../../core/content-translator/content-translator";
import {NullContentTranslator} from "../../core/content-translator/implementations/null/null-content-translator";
import {PseudoContentTranslator} from "../../core/content-translator/implementations/pseudo/pseudo-content-translator";

import {pluginName, PluginConfig} from "../plugin-config";
import {TranslateCommandConfig} from "./translate-command-config";

/**
 * Represents the command.
 */
export class TranslateCommand
{
    private _config: PluginConfig;
    private _templateLanguage: ITemplateLanguage;
    private _templateParserConfig: TemplateParserConfig;

    /**
     * Creates a new instance of the TranslateCommand type.
     * @param config The plugin configuration to use.
     * @param templateLanguage The ITemplateLanguage instance to use.
     */
    public constructor(config: PluginConfig, templateParserConfig: TemplateParserConfig, templateLanguage: ITemplateLanguage)
    {
        this._config = config;
        this._templateParserConfig = templateParserConfig;
        this._templateLanguage = templateLanguage;
    }

    /**
     * Creates the stream transform.
     * @param config The command configuration to use.
     * @returns The stream transform.
     */
    public create(config: TranslateCommandConfig): NodeJS.ReadWriteStream
    {
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
                    // Read and parse the non-localized export file.
                    const exportFile = ExportFile.parse((file.contents as Buffer).toString(), path.extname(file.path));

                    // Create the new import file instance.
                    var importFile = new ImportFile();

                    // Create the translator.
                    var contentTranslator = _this.getContentTranslator(config.translator);

                    // Translate the contents and add it to the import file.
                    for (var id of Object.keys(exportFile.contents))
                    {
                        const content = exportFile.contents[id].content;
                        importFile.set("./", id, contentTranslator.translate(content));
                    }

                    // Write the localized input file to the destination.
                    file.contents = new Buffer(importFile.stringify(config.fileNameExtension || path.extname(file.path)));
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
     * Geta a named content translator implementation, or the specified instance.
     */
    private getContentTranslator(nameOrInstance: undefined|string|IContentTranslator): IContentTranslator
    {
        if (nameOrInstance == null)
        {
            return new NullContentTranslator();
        }

        if (typeof nameOrInstance === "string")
        {
            switch (nameOrInstance)
            {
                case "pseudo": return new PseudoContentTranslator(this._templateParserConfig, this._templateLanguage);
                default: throw new Error(`The content translator '${chalk.cyan(nameOrInstance)}' is not supported.`);
            }
        }

        return nameOrInstance as IContentTranslator;
    }
}
