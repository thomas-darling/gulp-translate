import * as cheerio from "cheerio";
import {TemplateParserConfig} from "../template-parser/template-parser-config";
import {ITemplateLanguage} from "../template-language/template-language";
import {IContentTranslator} from "./content-translator";

/**
 * Represents a translator implementation, which translates localizable content.
 * Use this for e.g. automated translation using a machine-translation service or for pseudo-localization during testing.
 */
export interface IContentTranslator
{
    /**
     * Translates the specified content.
     * @param templateHtml The content that should be translated.
     * @returns The translated content.
     */
    translate(templateHtml: string): string;
}

/**
 * Represents a base class for translators, which implements the basic parsing of included and excluded content,
 * while leaving the actual text translation to the concrete implementation.
 */
export abstract class ContentTranslator implements IContentTranslator
{
    private templateParserConfig: TemplateParserConfig;
    private templateLanguage: ITemplateLanguage;

    /**
     * Creates a new instance of the PseudoContentTranslator type.
     * @param templateParserConfig The TemplateParserConfig instance.
     * @param templateLanguage The ITemplateLanguage instance.
     */
    public constructor(templateParserConfig: TemplateParserConfig, templateLanguage: ITemplateLanguage)
    {
        this.templateParserConfig = templateParserConfig;
        this.templateLanguage = templateLanguage;
    }

    /**
     * Translates the specified content, producing pseudo-translated content suitable for identifying localization issues.
     * @param templateHtml The content that should be translated.
     * @returns The translated content.
     */
    public translate(templateHtml: string): string
    {
        // Extract any expressions to ensure we only parse standard HTML.
        const expressions: string[] = [];
        const standardHtml = this.templateLanguage.toStandardHtml(templateHtml, expressions);

        // Parse the template as HTML and get the root node.
        const $ = cheerio.load(standardHtml, { decodeEntities: false });
        const root = $.root().get(0);

        // Parse the root node.
        this.parseNode($, root, true);

        // Inject the previously extracted binding expressions back into the template.
        return this.templateLanguage.toTemplateHtml($.html(), expressions);
    }

    /**
     * Translates the specified text content.
     * @param text The text content that should be translated.
     * @returns The translated text content.
     */
    protected abstract translateText(text: string): string;

    /**
     * Recursively parses and translates the element tree and its attributes, starting with the specified element.
     * @param $ The CheerioStatic instance.
     * @param element The element representing the root of the tree.
     * @param translate True if the element should be translated, otherwise false.
     */
    private parseNode($: CheerioStatic, element: CheerioElement, translate: boolean): void
    {
        let translateChildren = translate;

        // Ignore the node if it does not represent an HTML element.
        if (element.type === "text")
        {
            // Should the text be translated?
            if (translate)
            {
                element.nodeValue = this.translateText(element.nodeValue);
            }
        }

        // Ignore the node if it does not represent an HTML element.
        if (element.type !== "root" && element.type !== "tag")
        {
            return;
        }

        // Try to find the translate attribute on the element.
        if (this.templateParserConfig.attributeName in element.attribs)
        {
            // Should the child nodes be translated?
            translateChildren = element.attribs[this.templateParserConfig.attributeName] !== "no";
        }

        // Parse the element attributes.
        for (let attrName of Object.keys(element.attribs))
        {
            this.parseAttribute($, element, attrName, translate);
        }

        // Parse child elements of the element.
        for (let childElement of element.children)
        {
            this.parseNode($, childElement, translateChildren);
        }
    }

    /**
     * Parses and translates the specified attribute.
     * @param $ The CheerioStatic instance.
     * @param element The element representing the root of the tree.
     * @param attrName The name of the attribute.
     * @param translate True if the element should be translated, otherwise false.
     */
    private parseAttribute($: CheerioStatic, element: CheerioElement, attrName: string, translate: boolean): void
    {
        // Try to get the name of the target attribute.
        let targetAttrName = this.templateParserConfig.attributePattern.getTargetName(attrName);

        // Ignore the node if it does not match the attribute pattern.
        if (targetAttrName == null)
        {
            return;
        }

        // Should the attribute be translated?
        if (!(targetAttrName in element.attribs))
        {
            element.attribs[targetAttrName] = this.translateText(element.attribs[targetAttrName]);
        }
        else if (element.attribs[attrName] !== "no")
        {
            element.attribs[attrName] = this.translateText(element.attribs[attrName]);
        }
    }
}
