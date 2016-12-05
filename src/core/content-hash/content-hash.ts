/**
 * Represents a content hash implementation, which generates a unique hash based on localizable content.
 */
export interface IContentHash
{
    /**
     * Gets a hash for the specified content and hint.
     * @param content The content based on which a hash should be computed.
     * @param hint The hint based on which a hash should be computed.
     * @returns A string representing the computed hash.
     */
    compute(content: string, hint?: string): string;
}
