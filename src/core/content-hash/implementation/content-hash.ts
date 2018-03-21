import * as crypto from "crypto";
import { IContentHash } from "../content-hash";

/**
 * Represents a content hash implementation, which generates a unique SHA-1 hash based on localizable content.
 */
export class ContentHash implements IContentHash
{
    private _hashLength: number;
    private _hashMap: { [shortHash: string]: string } = {};

    /**
     * Creates a new instance of the DefaultContentHash type.
     * @param hashLength The length of the hash identifying a content instance, in the range [1, 32].
     */
    public constructor(hashLength: number)
    {
        this._hashLength = hashLength;
    }

    /**
     * Gets a hash for the specified content and hint.
     * @param content The content based on which a hash should be computed.
     * @param hint The hint based on which a hash should be computed.
     * @returns A string representing the computed hash.
     */
    public compute(content: string, hint?: string): string
    {
        const unhashed = `${content}:${hint || ""}`;

        const longHash = crypto.createHash("sha1").update(unhashed, "utf8").digest("hex") as string;
        const shortHash = longHash.substring(0, this._hashLength);
        const cachedHash = this._hashMap[shortHash] || (this._hashMap[shortHash] = longHash);

        if (cachedHash !== longHash)
        {
            throw new Error("A content hash collision was detected. You may need to increase the hash length.");
        }

        return shortHash;
    }
}
