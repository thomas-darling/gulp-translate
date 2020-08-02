import { ITemplateLanguage } from "../../template-language";

/**
 * Represents an ITemplateLanguage implementation that supports the Aurelia templating language.
 */
export class AureliaTemplateLanguage implements ITemplateLanguage
{
    /**
     * Gets the standard, parser-safe HTML for the template.
     * All binding expressions will be replaced with placeholders of the form '${index}',
     * and the original expression will be added to the expressions array at that index.
     * @param template The HTML string representing the template in which expressions should be replaced with placeholders.
     * @param expressions The array to which the original expressions should be added.
     */
    public toStandardHtml(template: string, expressions: string[]): string
    {
        let result = "";
        let sequenceStartIndex = 0;
        let expectOpenBrace = false;
        let braceDepth = 0;
        let quoteChar: string | null = null;
        let escape = false;

        for (let i = 0; i < template.length; i++)
        {
            const c = template[i];

            if (braceDepth === 0)
            {
                if (c === "$")
                {
                    expectOpenBrace = true;
                }
                else if (expectOpenBrace)
                {
                    expectOpenBrace = false;

                    if (c === "{")
                    {
                        braceDepth++;

                        result += template.substring(sequenceStartIndex, i - 1);
                        sequenceStartIndex = i - 1;
                    }
                }
            }
            else
            {
                if (quoteChar != null)
                {
                    if (c === "\\" && !escape)
                    {
                        escape = true;
                    }
                    else
                    {
                        if (c === quoteChar && !escape)
                        {
                            quoteChar = null;
                        }

                        escape = false;
                    }
                }
                else if (c === '"' || c === "'" || c === "`")
                {
                    quoteChar = c;
                }
                else if (c === "{")
                {
                    braceDepth++;
                }
                else if (c === "}")
                {
                    if (braceDepth === 0)
                    {
                        throw new Error("Unbalanced braces in expression.");
                    }

                    braceDepth--;

                    if (braceDepth === 0)
                    {
                        expressions.push(template.substring(sequenceStartIndex, i + 1));
                        // tslint:disable-next-line: prefer-template restrict-plus-operands
                        result += "${" + (expressions.length - 1) + "}";
                        sequenceStartIndex = i + 1;
                    }
                }
            }
        }

        if (quoteChar != null)
        {
            throw new Error("Unbalanced quotes in expression.");
        }

        if (braceDepth < 0)
        {
            throw new Error("Unbalanced braces in expression.");
        }

        if (escape)
        {
            throw new Error("Expected character after escape.");
        }

        return result + template.substring(sequenceStartIndex, template.length);
    }

    /**
     * Gets the non-standard, non-parser-safe HTML for the template.
     * All binding expression placeholders of the form '${index}' will be replaced with, the
     * original expressions, which are assumed to be in the expressions array at that index.
     * @param template The HTML string representing the template in which expressions have been replaced with placeholders.
     * @param expressions The array containing the original expressions for the placeholders in the template.
     */
    public toTemplateHtml(template: string, expressions: string[]): string
    {
        return template.replace(/\${(\d+)}/g, (match, index) => expressions[index]);
    }
}
