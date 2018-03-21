import { IContentTranslator } from "../../content-translator";

/**
 * Represents a translator implementation, which returns the localizable content unchanged.
 */
export class NullContentTranslator implements IContentTranslator
{
    /**
     * Translates the specified content, producing unchanged content suitable for creation of import files in the base language.
     * @param templateHtml The content that should be translated.
     * @returns The translated content.
     */
    public translate(templateHtml: string): string
    {
        return templateHtml;
    }
}
