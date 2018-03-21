import { TemplateParserConfig } from "../../../template-parser/template-parser-config";
import { ITemplateLanguage } from "../../../template-language/template-language";
import { ContentTranslator } from "../../content-translator";

/**
 * Represents a translator implementation, which translates localizable content into pseudo-translated content.
 * Pseudo-localization is used during testing and allows localization issues to be identified earlier and more reliably.
 * Note that this service only handles strings in latin-based languages and is primarily intended for use with English.
 */
export class PseudoContentTranslator extends ContentTranslator
{
    /**
     * Creates a new instance of the PseudoContentTranslator type.
     * @param templateParserConfig The TemplateParserConfig instance.
     * @param templateLanguage The ITemplateLanguage instance.
     */
    public constructor(templateParserConfig: TemplateParserConfig, templateLanguage: ITemplateLanguage)
    {
        super(templateParserConfig, templateLanguage);
    }

    /**
     * Translates the specified text content.
     * @param text The text content that should be translated.
     * @returns The translated text content.
     */
    protected translateText(text: string): string
    {
        let result = "";
        const isWhitespace = /^\s*$/.test(text);

        if (isWhitespace)
        {
            result = text;
        }
        else
        {
            // Begin the string with a bracket to help identify strings that are being cut off or concatenated.
            result += "[";

            // Insert periods between word characters.

            let waitingForCharacterEnd = false;

            for (let i = 0; i < text.length; i++)
            {
                const character = text[i];

                switch (character)
                {
                    case "&": waitingForCharacterEnd = true; break;
                    case " ": waitingForCharacterEnd = false; break;
                    case ";": waitingForCharacterEnd = false;
                }

                if (waitingForCharacterEnd)
                {
                    result += character;
                    continue;
                }

                result += character;

                if (character.match(/\w/) && i < text.length - 1 && text[i + 1].match(/\w/) && !text[i + 1].match(/_/))
                {
                    result += ":";
                }
            }

            // End the string with a bracket to help identify strings that are being cut off or concatenated.
            result += "]";
        }

        // Return the pseudo-translated string.
        return result;
    }
}
