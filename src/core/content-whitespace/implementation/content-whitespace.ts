import chalk from "chalk";
import { IContentWhitespace, WhitespaceOption } from "../content-whitespace";

/*
 * Represents a strategy for normalizing whitespace in the content exported from templates.
 */
export class ContentWhitespace implements IContentWhitespace
{
    /**
     * Gets the default whitespace handling option for the specified element or attribute.
     * @param elementName The name of the element for which to get the default option, or to which the attrName applies.
     * @param attrName The name of the attribute for which to get the default option, or undefined to get the default option for the element content.
     * @returns The default whitespace handling option for the specified element or attribute.
     */
    public getDefault(elementName: string, attrName?: string): WhitespaceOption
    {
        if (attrName == null)
        {
            if (["textarea", "input", "select", "option", "pre", "xmp", "plaintext", "listing"].indexOf(elementName) >= 0)
            {
                return "pre";
            }

            return "trim";
        }
        else
        {
            return "pre";
        }
    }

    /**
     * Normalizes whitespace in the content according to the specified whitespace handling option.
     * @param content The content for which whitespace should be normalized.
     * @param option The whitespace handling to apply.
     * @returns The content where whitespace has been normalized.
     */
    public normalize(content: string, option: WhitespaceOption): string
    {
        switch (option)
        {
            case "trim": return this.normalize(content, "normal").replace(/^\s|\s$/g, "");
            case "normal": return content.replace(/\s+/g, " ");
            case "pre": return content;
            case "pre-line": return content.split("\n").map(c => this.normalize(c, "trim")).join("\n");
            default:
                throw new Error(`Unknown whitespace handling option '${chalk.cyan(option)}'.`);
        }
    }
}
