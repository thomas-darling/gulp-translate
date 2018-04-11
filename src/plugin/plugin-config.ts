import chalk from "chalk";

import { ITemplateLanguage } from "../core/template-language/template-language";
import { ITemplateParserConfig } from "../core/template-parser/template-parser-config";

import { NullTemplateLanguage } from "../core/template-language/implementations/null/null-template-language";
import { AureliaTemplateLanguage } from "../core/template-language/implementations/aurelia/aurelia-template-language";
import { AngularTemplateLanguage } from "../core/template-language/implementations/angular/angular-template-language";

/**
 * Represents the plugin configuration.
 */
export interface IPluginConfig
{
    /**
     * The name of the attribute identifying elements whose content should
     * be translated.
     * Default is 'translate'.
     */
    attributeName?: string;

     /**
      * The pattern used when identifying attributes whose content should be
      * translated, where '*' represents the name of the target attribute.
      * Default is '*.translate'.
      */
    attributePattern?: string;

    /**
     * True to enable direct annotations of attributes, such that if the
     * target attribute does not exist, the attribute matched by the attribute
     * pattern is assumed to be the attribute containing the content. This
     * means, that if no options need to be specified, we can just change
     * the attribute name to match the pattern, instead of adding a separate
     * annotation attribute. Note however, that this also means that orphaned
     * annotations will not be treated as errors, as they will be assumed to
     * contain localizable content. If enabled, warnings may be logged during
     * export, if the content looks suspiciously like an annotation.
     * Default is false.
     */
    allowDirectAnnotation?: boolean;

    /**
     * True to prefix the ids of content found in content files with the
     * relative file path of the content file, without the extension.
     * Enable this to keep the ids in content files short, thus making them
     * easier to work with in code.
     * Note that ids starting with "/" or "./" will not be prefixed.
     * An example of a prefixed id would be "./foo/bar:id", where './foo/bar'
     * is the file path without the extension and 'id' is a id in the file.
     * Default is false.
     */
    prefixIdsInContentFiles?: boolean;

    /**
     * The template language to use, or undefined to use no template language.
     * Default is undefined.
     */
    templateLanguage?: "aurelia" | "angular" | ITemplateLanguage;

    /**
     * The length of the hash identifying content, in the range [1, 32].
     * Default is 9.
     */
    hashLength?: number;
}

/**
 * Represents the plugin configuration.
 */
export class PluginConfig implements ITemplateParserConfig
{
    /**
     * Creates a new instance of the PluginConfig type.
     * @param config The config object from which the instance should be created.
     */
    public constructor(config?: IPluginConfig)
    {
        if (config == undefined)
        {
            return;
        }

        if (config.attributeName != undefined)
        {
            this.attributeName = config.attributeName;
        }

        if (config.attributePattern != undefined)
        {
            this.attributePattern = config.attributePattern;
        }

        if (config.allowDirectAnnotation != undefined)
        {
            this.allowDirectAnnotation = config.allowDirectAnnotation;
        }

        if (config.prefixIdsInContentFiles != undefined)
        {
            this.prefixIdsInContentFiles = config.prefixIdsInContentFiles;
        }

        this.templateLanguage = this.getTemplateLanguage(config.templateLanguage);

        if (config.hashLength != undefined)
        {
            if (config.hashLength < 1 || config.hashLength > 32)
            {
                throw new Error(`The '${chalk.cyan("hashLength")}' option must be a number in the range ${chalk.cyan("[1, 32]")}.`);
            }

            this.hashLength = config.hashLength;
        }
    }

    /**
     * The name of the attribute identifying elements whose content
     * should be translated.
     */
    public attributeName: string = "translate";

    /**
     * The pattern used when identifying attributes whose content should be
     * translated, where '*' represents the name of the target attribute.
     */
    public attributePattern: string = "*.translate";

    /**
     * True to enable direct annotations of attributes, such that if the
     * target attribute does not exist, the attribute matched by the attribute
     * pattern is assumed to be the attribute containing the content. This
     * means, that if no options need to be specified, we can just change
     * the attribute name to match the pattern, instead of adding a separate
     * annotation attribute. Note however, that this also means that orphaned
     * annotations will not be treated as errors, as they will be assumed to
     * contain localizable content. If enabled, warnings may be logged during
     * export, if the content looks suspiciously like an annotation.
     */
    public allowDirectAnnotation: boolean = false;

    /**
     * True to prefix the ids of content found in content files with the
     * relative file path of the content file, without the extension.
     * Enable this to keep the ids in content files short, thus making them
     * easier to work with in code.
     * Note that ids starting with "/" or "./" will not be prefixed.
     * An example of a prefixed id would be "./foo/bar:id", where './foo/bar'
     * is the file path without the extension and 'id' is a id in the file.
     */
    public prefixIdsInContentFiles: boolean = false;

    /**
     * The template language to use, or undefined to use no template language.
     */
    public templateLanguage: ITemplateLanguage;

    /**
     * The length of the hash identifying content, in the range [1, 32].
     */
    public hashLength: number = 9;

    /**
     * Gets a named template language implementation, or the specified instance.
     */
    private getTemplateLanguage(nameOrInstance: undefined | string | ITemplateLanguage): ITemplateLanguage
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
