/**
 * Defines the available options for handling whitespace in content.
 * The options are 'trim', 'pre', 'pre-line' and 'normal'.
 * The options 'pre', 'pre-line' and 'normal' behave exactly as the CSS white-space property.
 * The option 'trim', which is the default for element content, is optimized for translation,
 * and it behaves like 'normal', except it completely removes any whitespace before and after the content.
 * For attribute content, the default is 'pre', as whitespace would generally only be present, if it was intentionally added.
 */
export type WhitespaceOption = "trim" | "normal" | "pre" | "pre-line";
export const whitespaceOptions = ["trim", "normal", "pre", "pre-line"];

/*
 * Represents a strategy for normalizing whitespace in the content exported from templates.
 */
export interface IContentWhitespace
{
    /**
     * Gets the default whitespace handling option for the specified element or attribute.
     * @param elementName The name of the element for which to get the default option, or to which the attrName applies.
     * @param attrName The name of the attribute for which to get the default option, or undefined to get the default option for the element content.
     * @returns The default whitespace handling option for the specified element or attribute.
     */
    getDefault(elementName: string, attrName?: string): WhitespaceOption;

    /**
     * Normalizes whitespace in the content according to the specified whitespace handling option.
     * @param content The content for which whitespace should be normalized.
     * @param option The whitespace handling to apply.
     * @returns The content where whitespace has been normalized.
     */
    normalize(content: string, option: WhitespaceOption): string;
}
