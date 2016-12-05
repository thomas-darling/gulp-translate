/*
 * Represents an HTML template language implementation.
 * Because binding expressions may contain '<' and '>' characters, and other characters that should not be HTML encoded,
 * any expressions found in the document are extracted into an array and replaced with numbered expression placeholders,
 * where the number is the index of the actual expression in the expression array.
 */
export interface ITemplateLanguage
{
    /**
     * Gets the standard, parser-safe HTML for the template.
     * All binding expressions will be replaced with placeholders, and the original expressions will be added to the
     * expressions array at the indexes indicated by the placeholders.
     * @param template The HTML string representing the template in which expressions should be replaced with placeholders.
     * @param expressions The array to which the original expressions should be added.
     */
    toStandardHtml(templateHtml: string, expressions: string[]): string;

    /**
     * Gets the non-standard, non-parser-safe HTML for the template.
     * All binding expression placeholders will be replaced with the original expressions, which are assumed to be in the
     * expressions array at the indexes indicated by the placeholders.
     * @param template The HTML string representing the template in which expressions have been replaced with placeholders.
     * @param expressions The array containing the original expressions for the placeholders in the template.
     */
    toTemplateHtml(standardHtml: string, expressions: string[]): string;
}
