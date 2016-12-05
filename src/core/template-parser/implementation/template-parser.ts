import * as cheerio from "cheerio";
import * as chalk from "chalk";
import {IContentHash} from "../../content-hash/content-hash";
import {ITemplateLanguage} from "../../template-language/template-language";
import {IContentWhitespace} from "../../content-whitespace/content-whitespace";
import {ITemplateParser, ITemplate, IContent, IAnnotation} from "../template-parser";
import {TemplateParserConfig} from "../template-parser-config";
import {Template, ElementAnnotation, AttributeAnnotation, ElementContent, AttributeContent} from "./template";

/**
 * Represents a parser that parses localizable content instances from an HTML string.
 */
export class CheerioTemplateParser implements ITemplateParser
{
    private templateLanguage: ITemplateLanguage;
    private templateWhitespace: IContentWhitespace;
    private contentHash: IContentHash;
    private config: TemplateParserConfig;

    /**
     * Creates a new instance of the CheerioTemplateParser type.
     * @param config The TemplateParserConfig instance.
     * @param templateLanguage The ITemplateLanguage instance.
     * @param templateWhitespace The ITemplateWhitespace instance.
     * @param contentHash The IContentHash instance.
     */
    public constructor(config: TemplateParserConfig, templateLanguage: ITemplateLanguage,
        templateWhitespace: IContentWhitespace, contentHash: IContentHash)
    {
        this.templateLanguage = templateLanguage;
        this.templateWhitespace = templateWhitespace;
        this.contentHash = contentHash;
        this.config = config;
    }

    /**
     * Gets all the localizable content from the specified HTML string.
     * @param html The HTML string representing the template from which the localizable content should be parsed.
     * @returns An ITemplate instance containing the localizable content found in the template.
     */
    public parse(template: string): ITemplate
    {
        const contents: IContent[] = [];
        const annotations: IAnnotation[] = [];

        // Extract any expressions to ensure we only parse standard HTML.
        const expressions: string[] = [];
        const standardHtml = this.templateLanguage.toStandardHtml(template, expressions);

        // Parse the template as HTML and get the root node.
        const $ = cheerio.load(standardHtml, { decodeEntities: false });
        const root = $.root().get(0);

        // Parse the node tree, starting with the root node.
        this.parseNode($, root, expressions, contents, annotations, false, null);

        // Return a template instance.
        return new Template($, expressions, contents, annotations, this.templateLanguage);
    }

    /**
     * Recursively parses the element tree and its attributes, starting with the specified element.
     * @param $ The CheerioStatic instance.
     * @param element The element representing the root of the tree.
     * @param expressions The array containing the original expressions for the placeholders in the template.
     * @param contents The array to which exported content instances should be added.
     * @param annotations The array to which extracted annotation instances should be added.
     * @param extract True if the element or one of its ancestor elements should be translated, otherwise false.
     * @param translate True if the element should be translated, otherwise false.
     */
    private parseNode($: CheerioStatic, element: CheerioElement, expressions: string[],
        contents: IContent[], annotations: IAnnotation[], extract: boolean, translate: boolean|null): void
    {
        let extractChildren = extract;
        let translateChildren = translate;

        // Ignore the node if it does not represent an HTML element.
        if (element.type !== "root" && element.type !== "tag")
        {
            return;
        }

        // Try to find the translate attribute on the element.
        if (this.config.attributeName in element.attribs)
        {
            const annotation = new ElementAnnotation($(element), this.config.attributeName, translate != null);

            if (!extract)
            {
                if (!annotation.translate)
                {
                    if (translate === false)
                    {
                        throw new Error(`A translate annotation within a non-translatable element can only contain the value '' or '${chalk.cyan("yes")}'.`);
                    }

                    translateChildren = false;
                    extractChildren = false;
                }
                else if (!annotation.hasOptions)
                {
                    // Add the element content to the content list.
                    contents.push(new ElementContent(annotation, expressions, this.contentHash, this.templateLanguage, this.templateWhitespace));

                    translateChildren = true;
                    extractChildren = true;
                }
                else
                {
                    // Add the element content to the content list.
                    contents.push(new ElementContent(annotation, expressions, this.contentHash, this.templateLanguage, this.templateWhitespace));

                    translateChildren = true;
                    extractChildren = true;
                }
            }
            else
            {
                if (!annotation.translate)
                {
                    if (!translate)
                    {
                        throw new Error(`A translate annotation within a non-translatable element can only contain the value '' or '${chalk.cyan("yes")}'.`);
                    }

                    translateChildren = false;
                }
                else if (!annotation.hasOptions)
                {
                    if (translate)
                    {
                        throw new Error(`A translate annotation within a translatable element can only contain the value '${chalk.cyan("no")}'.`);
                    }

                    translateChildren = true;
                }
                else
                {
                    throw new Error(`A translate annotation within translatable content can only contain the value '', '${chalk.cyan("yes")}' or '${chalk.cyan("no")}'.`);
                }
            }

            // Add the annotation to the annotation list, so it can be cleaned later.
            annotations.push(annotation);
        }

        // Parse the element attributes.
        for (let attrName of Object.keys(element.attribs))
        {
            this.parseAttribute($, element, attrName, contents, annotations, expressions, extract, translate);
        }

        // Parse child elements of the element.
        for (let childElement of element.children)
        {
            this.parseNode($, childElement, expressions, contents, annotations, extractChildren, translateChildren);
        }
    }

    /**
     * Parses the specified attribute.
     * @param $ The CheerioStatic instance.
     * @param element The element representing the root of the tree.
     * @param attrName The name of the attribute.
     * @param contents The array to which exported content instances should be added.
     * @param annotations The array to which extracted annotation instances should be added.
     * @param expressions The array containing the original expressions for the placeholders in the template.
     * @param extract True if the element or one of its ancestor elements should be translated, otherwise false.
     * @param translate True if the element should be translated, otherwise false.
     */
    private parseAttribute($: CheerioStatic, element: CheerioElement, attrName: string,
        contents: IContent[], annotations: IAnnotation[], expressions: string[], extract: boolean, translate: boolean|null): void
    {
        // Try to get the name of the target attribute.
        const targetAttrName = this.config.attributePattern.getTargetName(attrName);

        // Ignore the node if it does not match the attribute pattern.
        if (targetAttrName == null)
        {
            return;
        }

        // Is this a direct or orphaned annotation?
        if (!(targetAttrName in element.attribs))
        {
            if (this.config.allowDirectAnnotation)
            {
                const annotation = new AttributeAnnotation($(element), attrName, targetAttrName, attrName, translate != null);

                if (!extract)
                {
                    // Add the attribute content to the content list.
                    contents.push(new AttributeContent(annotation, expressions, this.contentHash, this.templateLanguage, this.templateWhitespace));
                }
                else
                {
                    if (translate)
                    {
                        throw new Error(`A translate annotation within a translatable element can only contain the value '${chalk.cyan("no")}'.`);
                    }

                    // Add the annotation to the annotation list, so it can be cleaned later.
                    contents.push(new AttributeContent(annotation, expressions, this.contentHash, this.templateLanguage, this.templateWhitespace));
                }

                // Add the annotation to the annotation list, so it can be cleaned later.
                annotations.push(annotation);
            }
            else
            {
                throw new Error("An orphaned translate annotation was found.");
            }

            return;
        }

        const annotation = new AttributeAnnotation($(element), attrName, targetAttrName, targetAttrName, translate != null);

        if (!extract)
        {
            if (!annotation.translate)
            {
                if (translate === false)
                {
                    throw new Error(`A translate annotation within a non-translatable element can only contain the value '' or '${chalk.cyan("yes")}'.`);
                }
            }
            else if (!annotation.hasOptions)
            {
                // Add the attribute content to the content list.
                contents.push(new AttributeContent(annotation, expressions, this.contentHash, this.templateLanguage, this.templateWhitespace));
            }
            else
            {
                // Add the attribute content to the content list.
                contents.push(new AttributeContent(annotation, expressions, this.contentHash, this.templateLanguage, this.templateWhitespace));
            }
        }
        else
        {
            if (!annotation.translate)
            {
                if (!translate)
                {
                    throw new Error(`A translate annotation within a non-translatable element can only contain the value '' or '${chalk.cyan("yes")}'.`);
                }
            }
            else if (!annotation.hasOptions)
            {
                if (translate)
                {
                    throw new Error(`A translate annotation within a translatable element can only contain the value '${chalk.cyan("no")}'.`);
                }

                // Add the annotation to the annotation list, so it can be cleaned later.
                contents.push(new AttributeContent(annotation, expressions, this.contentHash, this.templateLanguage, this.templateWhitespace));
            }
            else
            {
                throw new Error(`A translate annotation within translatable content can only contain the value '', '${chalk.cyan("yes")}' or '${chalk.cyan("no")}'.`);
            }
        }

        // Add the annotation to the annotation list, so it can be cleaned later.
        annotations.push(annotation);
    }
}
