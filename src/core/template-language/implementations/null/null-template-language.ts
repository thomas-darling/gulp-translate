import {ITemplateLanguage} from "../../template-language";

/**
 * Represents an ITemplateLanguage implementation that does not support any templating language.
 */
export class NullTemplateLanguage implements ITemplateLanguage
{
    /**
     * Gets the standard, parser-safe HTML for the template.
     * @param template The HTML string representing the template in which expressions should be replaced with placeholders.
     * @param expressions The array to which the original expressions should be added.
     */
    public toStandardHtml(template: string, expressions: string[]): string
    {
        return template;
    }

    /**
     * Gets the non-standard, non-parser-safe HTML for the template.
     * @param template The HTML string representing the template in which expressions have been replaced with placeholders.
     * @param expressions The array containing the original expressions for the placeholders in the template.
     */
    public toTemplateHtml(template: string, expressions: string[]): string
    {
        return template;
    }
}
